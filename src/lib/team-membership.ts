import type { Teamspace, UserProfile } from '@/types';

export function getPrimaryTeamspaceId(user: UserProfile | null | undefined) {
  return Array.isArray(user?.teamspaceIds) && user.teamspaceIds.length > 0
    ? user.teamspaceIds[0]
    : null;
}

export function belongsToTeamLeadTeam(
  member: UserProfile,
  teamLead: UserProfile | null | undefined,
  currentTeamspace: Teamspace | null | undefined
) {
  if (!teamLead || member.role !== 'sales_executive') return false;

  const currentTeamspaceId = currentTeamspace?.id || null;
  const memberPrimaryTeamspaceId = getPrimaryTeamspaceId(member);
  const teamLeadPrimaryTeamspaceId = getPrimaryTeamspaceId(teamLead);

  return (
    member.createdBy === teamLead.id ||
    (Boolean(currentTeamspaceId) && memberPrimaryTeamspaceId === currentTeamspaceId) ||
    (Boolean(teamLeadPrimaryTeamspaceId) && memberPrimaryTeamspaceId === teamLeadPrimaryTeamspaceId)
  );
}
