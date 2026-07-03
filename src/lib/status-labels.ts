import type { DealStage, LeadStatus } from '@/types';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Pending',
  done: 'Completed',
  'not intrested': 'Rejected',
  intrested: 'Holding',
  CNP: 'Not Connected',
};

export const LEAD_STATUS_ORDER: LeadStatus[] = ['new', 'done', 'not intrested', 'intrested', 'CNP'];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new: 'Pending',
  done: 'Completed',
  'not intrested': 'Rejected',
  intrested: 'Holding',
  CNP: 'Not Connected',
  'not connect': 'Not Connected',
};

export const getLeadStatusLabel = (status: LeadStatus) => LEAD_STATUS_LABELS[status] || status;

export const getDealStageLabel = (stage: DealStage) => DEAL_STAGE_LABELS[stage] || stage;
