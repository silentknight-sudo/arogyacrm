'use client';

import { useEffect, useRef } from 'react';
import { collection, onSnapshot, orderBy, query, where, writeBatch, doc } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import type { Lead } from '@/types';

function getReminderIsoDate(value: any) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value?.toDate) return value.toDate().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export function LeadReminderListener() {
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const hasPrimed = useRef(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'sales_team_lead' || !currentTeamspace?.id) return;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    const q = query(
      leadsRef,
      where('assignedToIds', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async snapshot => {
      if (!hasPrimed.current) {
        hasPrimed.current = true;
      }

      const today = new Date().toISOString().slice(0, 10);
      const dueLeads = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Lead))
        .filter(lead =>
          (lead.reminderDays || 0) > 0 &&
          getReminderIsoDate(lead.reminderAt) === today &&
          !lead.reminderNotifiedAt
        );

      if (dueLeads.length === 0) return;

      const batch = writeBatch(firestore);
      const notificationTime = new Date().toISOString();

      dueLeads.forEach(lead => {
        const notificationRef = doc(collection(firestore, 'users', currentUser.id, 'notifications'));
        batch.set(notificationRef, {
          title: 'Lead Reminder Due',
          description: `You have a reminder to connect with ${lead.fullName} today.`,
          type: 'lead_reminder',
          timestamp: notificationTime,
          read: false,
          link: '/leads',
        });

        const leadRef = doc(firestore, 'teamspaces', currentTeamspace.id, 'leads', lead.id);
        batch.update(leadRef, {
          reminderNotifiedAt: notificationTime,
        });
      });

      await batch.commit();
    });

    return () => unsubscribe();
  }, [currentUser, currentTeamspace?.id, firestore]);

  return null;
}
