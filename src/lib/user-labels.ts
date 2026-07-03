import type { UserProfile, UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  sales_team_lead: 'Team Lead',
  sales_executive: 'Telecaller',
  marketer: 'Marketer',
  support: 'Support',
};

export function getRoleLabel(role?: UserRole | string) {
  if (!role) return 'User';
  return ROLE_LABELS[role as UserRole] || role.replace(/_/g, ' ');
}

export function getProfessionalEmployeeId(user: Pick<UserProfile, 'id' | 'employeeId' | 'role'>) {
  if (user.employeeId) return user.employeeId;

  const prefix =
    user.role === 'sales_team_lead'
      ? 'AGY-TL'
      : user.role === 'sales_executive'
        ? 'AGY-TC'
        : 'AGY-EMP';

  return `${prefix}-${user.id.slice(0, 6).toUpperCase()}`;
}
