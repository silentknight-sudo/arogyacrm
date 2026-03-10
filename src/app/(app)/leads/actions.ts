'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead, DealStage, LeadStatus, Deal } from '@/types';
import { LineItemSchema } from '../inventory/schemas';

/**
 * STRATEGIC SYNC: Automated Deal Conversion Logic
 * Ensures every active lead is mirrored as a Deal in the Sales Pipeline.
 */
async function syncDealForLead(leadId: string, teamspaceId: string) {
  try {
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const lead = leadDoc.data() as Lead;
    
    if (!lead || lead.status === 'canceled') return;

    const dealsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals');
    const existingDealQuery = await dealsRef.where('leadId', '==', leadId).limit(1).get();
    
    const ownerId = lead.assignedToIds?.[0] || '';
    let teamLeadId = '';
    
    if (ownerId) {
      const userDoc = await adminDb.collection('users').doc(ownerId).get();
      const userData = userDoc.data();
      if (userData?.role === 'sales_executive') {
        teamLeadId = userData.createdBy || '';
      } else if (userData?.role === 'sales_team_lead') {
        teamLeadId = ownerId;
      }
    }

    const dealData: Partial<Deal> = {
      leadId: leadId,
      name: `Automated: ${lead.fullName}`,
      ownerId: ownerId,
      teamLeadId: teamLeadId,
      stage: (lead.status === 'new' ? 'new' : 'pending') as DealStage,
      type: 'Automated Conversion',
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
      contactId: '', // Automated leads don't always have a contact record yet
    };

    // Aggregate Product Pricing
    if (lead.productAsked && lead.productAsked.length > 0) {
      const productsSnapshot = await adminDb.collection('products').where('__name__', 'in', lead.productAsked).get();
      const lineItems = productsSnapshot.docs.map(p => {
        const d = p.data();
        return {
          productId: p.id,
          productName: d.name,
          unitPrice: d.price,
          quantity: 1,
          subtotal: d.price
        };
      });
      dealData.lineItems = lineItems;
      dealData.amount = lineItems.reduce((s, i) => s + i.subtotal, 0);
    } else {
      dealData.lineItems = [];
      dealData.amount = 0;
    }

    if (existingDealQuery.empty) {
      const newDealRef = dealsRef.doc();
      await newDealRef.set({
        ...dealData,
        id: newDealRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await existingDealQuery.docs[0].ref.update(dealData);
    }
  } catch (error) {
    console.error('DEAL_SYNC_FAILURE:', error);
  }
}

export async function scoreLeadWithAI(lead: Lead) {
  try {
    const input: AiLeadScoringAndPrioritizationInput = {
      engagementScore: lead.engagementScore || 0,
      leadSource: lead.source || 'Unknown',
      demographicData: {
        industry: lead.demographicData?.industry || '',
        companySize: lead.demographicData?.companySize || '',
        jobTitle: lead.demographicData?.jobTitle || '',
        country: lead.demographicData?.country || '',
      },
      productAsked: lead.productAsked || [],
      leadStatus: lead.status,
      notes: lead.notes,
    };

    const result = await aiLeadScoringAndPrioritization(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error scoring lead with AI:', error);
    return { success: false, error: 'Failed to score lead.' };
  }
}

export async function updateLeadStatus(values: { leadId: string, teamspaceId: string, status: LeadStatus }): Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, status } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    await leadRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // TRIGGER SYNC
    await syncDealForLead(leadId, teamspaceId);

    revalidatePath('/leads');
    revalidatePath('/deals');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function updateLeadProducts(values: { leadId: string, teamspaceId: string, products: string[] }): Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, products } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    await leadRef.update({
      productAsked: products,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // TRIGGER SYNC: Automatic Deal creation/update on product selection
    await syncDealForLead(leadId, teamspaceId);

    revalidatePath('/leads');
    revalidatePath('/deals');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const AssignLeadSchema = z.object({
  leadId: z.string().min(1),
  teamspaceId: z.string().min(1),
  newAssignedToIds: z.array(z.string()).min(1, 'At least one user must be assigned.'),
  currentUserId: z.string().min(1),
});

export async function assignLead(values: z.infer<typeof AssignLeadSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, newAssignedToIds, currentUserId } = AssignLeadSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) throw new Error('User context not found.');
    
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    if (role === 'admin') {
        for (const id of newAssignedToIds) {
            const target = await adminDb.collection('users').doc(id).get();
            if (target.data()?.role !== 'sales_team_lead') {
                throw new Error('Administrators can only delegate to verified Team Leaders.');
            }
        }
    } else if (role === 'sales_team_lead') {
        for (const id of newAssignedToIds) {
            if (id === currentUserId) continue; 
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== currentUserId) {
                throw new Error('Team Leaders can only delegate to specialists they have personally onboarded.');
            }
        }
    } else {
        throw new Error('Unauthorized: You do not have delegation privileges.');
    }

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    await leadRef.update({
      assignedToIds: newAssignedToIds,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // SYNC DEAL OWNERSHIP
    await syncDealForLead(leadId, teamspaceId);

    revalidatePath('/leads');
    revalidatePath('/deals');

    return { success: true };

  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const BulkAssignSchema = z.object({
  leadIds: z.array(z.string()).min(1),
  teamspaceId: z.string().min(1),
  newAssignedToIds: z.array(z.string()).min(1),
  currentUserId: z.string().min(1),
});

export async function bulkAssignLeads(values: z.infer<typeof BulkAssignSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadIds, teamspaceId, newAssignedToIds, currentUserId } = BulkAssignSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) throw new Error('Unauthorized session.');
    
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    if (role === 'admin') {
        for (const id of newAssignedToIds) {
            const target = await adminDb.collection('users').doc(id).get();
            if (target.data()?.role !== 'sales_team_lead') {
                throw new Error('Strategic delegation restricted to Team Leaders only.');
            }
        }
    } else if (role === 'sales_team_lead') {
        for (const id of newAssignedToIds) {
            if (id === currentUserId) continue;
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== currentUserId) {
                throw new Error('You can only delegate prospects to specialists you have onboarded.');
            }
        }
    } else {
        throw new Error('Unauthorized access.');
    }

    const batch = adminDb.batch();
    leadIds.forEach(id => {
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      batch.update(ref, {
        assignedToIds: newAssignedToIds,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // TRIGGER SYNC FOR BATCH
    for (const id of leadIds) {
      await syncDealForLead(id, teamspaceId);
    }

    revalidatePath('/leads');
    revalidatePath('/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

// Export internal sync for import service
export { syncDealForLead };
