'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { useApp } from '@/context/app-context';
import type { UserProfile } from '@/types';
import { firebaseConfig } from '@/firebase/config';

type FirestoreValue = {
  stringValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
};

function readString(value: FirestoreValue | undefined) {
  return value?.stringValue || '';
}

async function loadRosterDirectly(token: string, teamLeadId: string): Promise<UserProfile[]> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'createdBy' },
              op: 'EQUAL',
              value: { stringValue: teamLeadId },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) throw new Error('Unable to load telecallers from Firestore.');
  const rows = await response.json();

  return rows.flatMap((row: { document?: { name?: string; fields?: Record<string, FirestoreValue> } }) => {
    const document = row.document;
    const fields = document?.fields;
    if (!document?.name || !fields || readString(fields.role) !== 'sales_executive') return [];

    return [{
      id: document.name.split('/').pop() || '',
      displayName: readString(fields.displayName) || readString(fields.email) || 'Team member',
      email: readString(fields.email),
      employeeId: readString(fields.employeeId) || undefined,
      avatar: readString(fields.avatar) || undefined,
      phone: readString(fields.phone) || undefined,
      dateOfBirth: readString(fields.dateOfBirth) || undefined,
      role: 'sales_executive' as const,
      accessStatus: readString(fields.accessStatus) === 'blocked' ? 'blocked' as const : 'approved' as const,
      teamspaceIds: (fields.teamspaceIds?.arrayValue?.values || []).map(readString).filter(Boolean),
      createdBy: readString(fields.createdBy) || undefined,
    }];
  });
}

export function useTeamRoster() {
  const auth = useAuth();
  const { currentUser, isUserLoading } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || currentUser?.role !== 'sales_team_lead') {
      setUsers([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const teamLeadId = currentUser.id;
    setIsLoading(true);
    setError(null);

    async function loadRoster() {
      try {
        const authUser = auth.currentUser;
        if (!authUser) throw new Error('Your session has expired. Please sign in again.');

        const token = await authUser.getIdToken();
        const response = await fetch('/api/team-roster', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        const roster = response.ok
          ? (Array.isArray(payload.users) ? payload.users : [])
          : await loadRosterDirectly(token, teamLeadId);

        setUsers(roster);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setUsers([]);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load telecallers.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadRoster();
    return () => controller.abort();
  }, [auth, currentUser?.id, currentUser?.role, isUserLoading]);

  return { users, isLoading, error };
}
