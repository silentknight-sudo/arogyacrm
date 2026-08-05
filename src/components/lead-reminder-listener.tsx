'use client';

import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, writeBatch, doc } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import type { Lead } from '@/types';

function getReminderDate(value: any) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  return new Date(value);
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
      where('assignedToIds', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, async snapshot => {
      if (!hasPrimed.current) {
        hasPrimed.current = true;
      }

      const now = new Date();
      const dueLeads = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Lead))
        .filter(lead =>
          (lead.reminderValue || 0) > 0 &&
          !!getReminderDate(lead.reminderAt) &&
          (getReminderDate(lead.reminderAt) as Date) <= now &&
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
    }, (error) => {
      console.error('Lead reminder listener failed:', error);
    });

    return () => unsubscribe();
  }, [currentUser, currentTeamspace?.id, firestore]);

  return null;
}
