import type { Lead, UserProfile, Teamspace } from '@/types';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';

export type RoleAwareLeadStage = 'fresh_uploads' | 'pending' | 'done' | 'not intrested' | 'intrested' | 'CNP';

function getAssignedUsers(lead: Lead, users: UserProfile[]) {
  return (lead.assignedToIds || [])
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean) as UserProfile[];
}

export function getRoleAwareLeadStage(
  lead: Lead,
  viewer: UserProfile | null | undefined,
  users: UserProfile[],
  currentTeamspace: Teamspace | null | undefined
): RoleAwareLeadStage {
  if (lead.status !== 'new') return lead.status;

  if (!viewer) return 'fresh_uploads';

  const assignedIds = lead.assignedToIds || [];
  const assignedUsers = getAssignedUsers(lead, users);

  if (viewer.role === 'admin') {
    const inAdminPool =
      assignedIds.length === 0 ||
      assignedIds.includes(viewer.id) ||
      assignedUsers.every((user) => user.role === 'admin');

    return inAdminPool ? 'fresh_uploads' : 'pending';
  }

  if (viewer.role === 'sales_team_lead') {
    const assignedToManagedTelecaller = assignedUsers.some(
      (user) => user.role === 'sales_executive' && belongsToTeamLeadTeam(user, viewer, currentTeamspace)
    );

    if (assignedToManagedTelecaller) return 'pending';
    return 'fresh_uploads';
  }

  return 'fresh_uploads';
}

export function matchesRoleAwareLeadStage(
  lead: Lead,
  stage: RoleAwareLeadStage,
  viewer: UserProfile | null | undefined,
  users: UserProfile[],
  currentTeamspace: Teamspace | null | undefined
) {
  return getRoleAwareLeadStage(lead, viewer, users, currentTeamspace) === stage;
}
