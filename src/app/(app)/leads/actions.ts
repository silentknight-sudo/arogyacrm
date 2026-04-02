'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead, DealStage, LeadStatus, Deal, LineItem } from '@/types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * STRATEGIC SYNC: Automated Deal Conversion Logic
 * Maps lead statuses directly to deal stages for pipeline accuracy.
 */
export async function syncDealForLead(leadId: string, teamspaceId: string) {
  try {
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const lead = leadDoc.data() as Lead;
    
    if (!lead || lead.status === 'not intrested') {
        const dealsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals');
        const existingDealQuery = await dealsRef.where('leadId', '==', leadId).get();
        if (!existingDealQuery.empty) {
            const batch = adminDb.batch();
            existingDealQuery.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
            await batch.commit();
        }
        return;
    }

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

    const stageMap: Record<string, DealStage> = {
        'new': 'new',
        'intrested': 'intrested',
        'pending': 'intrested',
        'interested': 'intrested',
        'CNP': 'CNP',
        'busy': 'CNP',
        'done': 'done',
        'not intrested': 'not intrested',
        'cancelled': 'not intrested',
        'not interested': 'not intrested',
        'Converted': 'done'
    };

    const dealData: Partial<Deal> = {
      leadId: leadId,
      name: `Prospect: ${lead.fullName}`,
      ownerId: ownerId,
      teamLeadId: teamLeadId,
      stage: stageMap[lead.status] || 'intrested',
      type: 'Automated Revenue Flow',
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
      contactId: '', 
    };

    if (lead.productAsked && lead.productAsked.length > 0) {
      const productsSnapshot = await adminDb.collection('products').where('__name__', 'in', lead.productAsked).get();
      const lineItems: LineItem[] = productsSnapshot.docs.map((p: QueryDocumentSnapshot) => {
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

const CreateLeadSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  productAsked: z.array(z.string()).default([]),
  source: z.string().optional(),
  status: z.enum(['new', 'intrested', 'CNP', 'done', 'not intrested']),
  attributionFields: z.string().optional(),
  teamspaceId: z.string().min(1),
  creatorId: z.string().min(1),
});

export async function createLead(values: z.infer<typeof CreateLeadSchema>) {
  try {
    const data = CreateLeadSchema.parse(values);
    const leadRef = adminDb.collection('teamspaces').doc(data.teamspaceId).collection('leads').doc();
    
    await leadRef.set({
      ...data,
      id: leadRef.id,
      assignedToIds: [data.creatorId],
      reassigned: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection('users').doc(data.creatorId).collection('notifications').add({
        title: 'you got 1 new leads',
        description: `New strategic prospect "${data.fullName}" has been added to your queue.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
    });

    await syncDealForLead(leadRef.id, data.teamspaceId);

    revalidatePath('/leads');
    revalidatePath('/deals');
    return { success: true, leadId: leadRef.id };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
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
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    let shouldResetToNew = false;

    if (role === 'admin') {
        for (const id of newAssignedToIds) {
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_team_lead' && targetData?.role !== 'sales_executive') {
                throw new Error('Administrators can only delegate to verified Team Leaders or Executives.');
            }
            // AUTOMATED RESET: If target is SE, set status to new
            if (targetData?.role === 'sales_executive') shouldResetToNew = true;
        }
    } else if (role === 'sales_team_lead') {
        for (const id of newAssignedToIds) {
            if (id === currentUserId) continue; 
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== currentUserId) {
                throw new Error('Team Leaders can only delegate to specialists they have personally onboarded.');
            }
            // AUTOMATED RESET: If target is SE, set status to new
            if (targetData?.role === 'sales_executive') shouldResetToNew = true;
        }
    } else {
        throw new Error('Unauthorized: You do not have delegation privileges.');
    }

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();

    const updateData: any = {
      assignedToIds: newAssignedToIds,
      reassigned: true,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (shouldResetToNew) {
      updateData.status = 'new';
    }

    await leadRef.update(updateData);

    for (const userId of newAssignedToIds) {
        await adminDb.collection('users').doc(userId).collection('notifications').add({
            title: 'you got 1 new leads',
            description: `Prospect "${leadDoc.data()?.fullName || 'Prospect'}" has been assigned to your professional desk.`,
            type: 'lead_assigned',
            timestamp: new Date().toISOString(),
            read: false,
            link: '/leads'
        });
    }

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
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    let shouldResetToNew = false;

    if (role === 'admin') {
        for (const id of newAssignedToIds) {
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_team_lead' && targetData?.role !== 'sales_executive') {
                throw new Error('Strategic delegation restricted to authorized Team Leaders or Executives.');
            }
            if (targetData?.role === 'sales_executive') shouldResetToNew = true;
        }
    } else if (role === 'sales_team_lead') {
        for (const id of newAssignedToIds) {
            if (id === currentUserId) continue;
            const target = await adminDb.collection('users').doc(id).get();
            const targetData = target.data();
            if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== currentUserId) {
                throw new Error('You can only delegate prospects to specialists you have onboarded.');
            }
            if (targetData?.role === 'sales_executive') shouldResetToNew = true;
        }
    } else {
        throw new Error('Unauthorized access.');
    }

    const batch = adminDb.batch();
    leadIds.forEach((id: string) => {
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      const updateData: any = {
        assignedToIds: newAssignedToIds,
        reassigned: true,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (shouldResetToNew) {
        updateData.status = 'new';
      }
      batch.update(ref, updateData);
    });

    await batch.commit();

    for (const userId of newAssignedToIds) {
        await adminDb.collection('users').doc(userId).collection('notifications').add({
            title: `you got ${leadIds.length} new leads`,
            description: `${leadIds.length} strategic prospects have been reassigned to your professional desk.`,
            type: 'lead_assigned',
            timestamp: new Date().toISOString(),
            read: false,
            link: '/leads'
        });
    }

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

const SelfAssignSchema = z.object({
  leadIds: z.array(z.string()).min(1),
  teamspaceId: z.string().min(1),
  currentUserId: z.string().min(1),
});

export async function selfAssignLeads(values: z.infer<typeof SelfAssignSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadIds, teamspaceId, currentUserId } = SelfAssignSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) throw new Error('User context not found.');
    
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    if (role !== 'admin' && role !== 'sales_team_lead') {
        throw new Error('Unauthorized: Executive governance required to reclaim prospects.');
    }

    const batch = adminDb.batch();
    leadIds.forEach((id: string) => {
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      batch.update(ref, {
        assignedToIds: [currentUserId],
        reassigned: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    await adminDb.collection('users').doc(currentUserId).collection('notifications').add({
        title: `you got ${leadIds.length} new leads`,
        description: `Successfully reclaimed ${leadIds.length} strategic prospects to your personal desk.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
    });

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

export async function cleanupDuplicateLeads(teamspaceId: string): Promise<{ success: boolean; removedCount?: number; error?: string }> {
  try {
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');
    const snapshot = await leadsRef.orderBy('createdAt', 'asc').get();
    
    const leads = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Lead);
    const seenPhones = new Map<string, string>(); 
    const toDelete: string[] = [];

    leads.forEach((lead: Lead) => {
      const phone = lead.phone?.trim();
      if (!phone) return;

      if (seenPhones.has(phone)) {
        toDelete.push(lead.id);
      } else {
        seenPhones.set(phone, lead.id);
      }
    });

    if (toDelete.length === 0) {
      return { success: true, removedCount: 0 };
    }

    const chunks = [];
    for (let i = 0; i < toDelete.length; i += 500) {
      chunks.push(toDelete.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = adminDb.batch();
      chunk.forEach((id: string) => {
        batch.delete(leadsRef.doc(id));
      });
      await batch.commit();
    }

    revalidatePath('/leads');
    return { success: true, removedCount: toDelete.length };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
