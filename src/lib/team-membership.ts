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

  // createdBy is the only signal that actually identifies which team lead
  // manages this executive. Falling back to "shares the same teamspace"
  // (as this used to) matches every executive in the org to every team
  // lead whenever they all share one teamspace, so every team lead's
  // dashboard/leads/device list silently shows the whole org instead of
  // just their own team. Use the repair action to backfill createdBy on
  // legacy accounts instead of widening this match.
  return member.createdBy === teamLead.id;
}
