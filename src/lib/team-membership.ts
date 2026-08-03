import type { Teamspace, UserProfile } from '@/types';

export function belongsToTeamLeadTeam(
  member: UserProfile,
  teamLead: UserProfile | null | undefined,
  currentTeamspace: Teamspace | null | undefined
) {
  if (!teamLead || member.role !== 'sales_executive') return false;

  const memberTeamspaceIds = Array.isArray(member.teamspaceIds) ? member.teamspaceIds : [];
  const teamLeadTeamspaceIds = Array.isArray(teamLead.teamspaceIds) ? teamLead.teamspaceIds : [];
  const currentTeamspaceId = currentTeamspace?.id;
  const currentMemberIds = Array.isArray(currentTeamspace?.memberIds) ? currentTeamspace.memberIds : [];

  return (
    member.createdBy === teamLead.id ||
    (currentTeamspaceId ? memberTeamspaceIds.includes(currentTeamspaceId) : false) ||
    currentMemberIds.includes(member.id) ||
    memberTeamspaceIds.some((id) => teamLeadTeamspaceIds.includes(id))
  );
}
