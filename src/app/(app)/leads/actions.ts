'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Lead, DealStage, LeadStatus, Deal, LineItem } from '@/types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { sendMetaCapiEvent } from '@/lib/meta-capi';

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
        'canceled': 'not intrested',
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
        description: `New prospect "${data.fullName}" has been added to your queue.`,
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

export async function updateLeadStatus(values: { leadId: string, teamspaceId: string, status: LeadStatus }): Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, status } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const lead = leadDoc.data() as Lead;

    await leadRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (lead.metaLeadId) {
        const metaEventName = status === 'done' ? 'Converted' : (status === 'intrested' ? 'Other' : 'Lead');
        await sendMetaCapiEvent({
            eventName: metaEventName,
            leadId: lead.metaLeadId,
            email: lead.email,
            phone: lead.phone,
            customData: {
                crm_status: status
            }
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

async function getReassignmentState(leadId: string, teamspaceId: string, currentUserId: string) {
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const leadData = leadDoc.data();
    
    if (!leadData) return false;
    if (leadData.reassigned) return true;
    
    const actorDoc = await adminDb.collection('users').doc(currentUserId).get();
    const actorRole = actorDoc.data()?.role;

    if (actorRole === 'admin' || actorRole === 'sales_team_lead') {
        if (leadData.assignedToIds?.length > 0) {
            const prevOwnerId = leadData.assignedToIds[0];
            const prevOwnerDoc = await adminDb.collection('users').doc(prevOwnerId).get();
            if (prevOwnerDoc.exists && prevOwnerDoc.data()?.role === 'sales_executive') {
                return true; 
            }
        }
        return false; 
    }
    
    return true; 
}

export async function assignLead(values: { leadId: string, teamspaceId: string, newAssignedToIds: string[], currentUserId: string }) {
  try {
    const { leadId, teamspaceId, newAssignedToIds, currentUserId } = values;

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const role = currentUserDoc.data()?.role;

    const reassigned = await getReassignmentState(leadId, teamspaceId, currentUserId);

    let shouldResetToNew = false;
    if (role === 'admin' || role === 'sales_team_lead') {
        const target = await adminDb.collection('users').doc(newAssignedToIds[0]).get();
        if (target.data()?.role === 'sales_executive') {
            shouldResetToNew = true;
        }
    }

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    
    const updateData: any = {
      assignedToIds: newAssignedToIds,
      reassigned,
      createdAt: FieldValue.serverTimestamp(), 
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (shouldResetToNew) {
      updateData.status = 'new';
    }

    await leadRef.update(updateData);

    for (const userId of newAssignedToIds) {
        await adminDb.collection('users').doc(userId).collection('notifications').add({
            title: 'you got 1 new leads',
            description: `Prospect has been assigned to your professional desk.`,
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

export async function bulkAssignLeads(values: { leadIds: string[], teamspaceId: string, newAssignedToIds: string[], currentUserId: string }) {
  try {
    const { leadIds, teamspaceId, newAssignedToIds, currentUserId } = values;

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const role = currentUserDoc.data()?.role;

    let shouldResetToNew = false;
    if (role === 'admin' || role === 'sales_team_lead') {
        const target = await adminDb.collection('users').doc(newAssignedToIds[0]).get();
        if (target.data()?.role === 'sales_executive') {
            shouldResetToNew = true;
        }
    }

    const batch = adminDb.batch();
    
    for (const id of leadIds) {
      const reassigned = await getReassignmentState(id, teamspaceId, currentUserId);
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      const updateData: any = {
        assignedToIds: newAssignedToIds,
        reassigned,
        createdAt: FieldValue.serverTimestamp(), 
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (shouldResetToNew) {
        updateData.status = 'new';
      }
      batch.update(ref, updateData);
    }

    await batch.commit();

    for (const userId of newAssignedToIds) {
        await adminDb.collection('users').doc(userId).collection('notifications').add({
            title: `you got ${leadIds.length} new leads`,
            description: `${leadIds.length} prospects have been assigned to your desk.`,
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

export async function selfAssignLeads(values: { leadIds: string[], teamspaceId: string, currentUserId: string }) {
  try {
    const { leadIds, teamspaceId, currentUserId } = values;
    const batch = adminDb.batch();
    
    for (const id of leadIds) {
      const reassigned = await getReassignmentState(id, teamspaceId, currentUserId);
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      batch.update(ref, {
        assignedToIds: [currentUserId],
        reassigned,
        createdAt: FieldValue.serverTimestamp(), 
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    await adminDb.collection('users').doc(currentUserId).collection('notifications').add({
        title: `you got ${leadIds.length} new leads`,
        description: `Successfully reclaimed ${leadIds.length} prospects to your desk.`,
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
    
    const leads = snapshot.docs.map(doc => doc.data() as Lead);
    const seenPhones = new Map<string, string>(); 
    const toDelete: string[] = [];

    leads.forEach(lead => {
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
      chunk.forEach(id => {
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

export async function deleteLeads(values: { leadIds: string[], teamspaceId: string, currentUserId: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { leadIds, teamspaceId, currentUserId } = values;

    const userDoc = await adminDb.collection('users').doc(currentUserId).get();
    const userData = userDoc.data();
    const role = userData?.role;
    const userTeamspaces = userData?.teamspaceIds || [];

    if (role === 'admin') {
        // Full access
    } else if (role === 'sales_team_lead') {
        if (!userTeamspaces.includes(teamspaceId)) {
            throw new Error('Unauthorized: You can only manage assets within your assigned teamspaces.');
        }
    } else {
        throw new Error('Unauthorized: Executive authority required for purging assets.');
    }

    const chunks = [];
    for (let i = 0; i < leadIds.length; i += 500) {
        chunks.push(leadIds.slice(i, i + 500));
    }

    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');
    const dealsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals');

    for (const chunk of chunks) {
        const batch = adminDb.batch();
        for (const id of chunk) {
            batch.delete(leadsRef.doc(id));
            const dealQuery = await dealsRef.where('leadId', '==', id).get();
            dealQuery.docs.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
    }

    revalidatePath('/leads');
    revalidatePath('/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}