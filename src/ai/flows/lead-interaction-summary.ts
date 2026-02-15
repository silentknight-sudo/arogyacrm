'use server';
/**
 * @fileOverview A Genkit flow for generating a concise summary of a sales lead's interactions and key details.
 *
 * - getLeadInteractionSummary - A function that handles the AI-generated summary process for a lead.
 * - LeadInteractionSummaryInput - The input type for the getLeadInteractionSummary function.
 * - LeadInteractionSummaryOutput - The return type for the getLeadInteractionSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LeadInteractionSummaryInputSchema = z.object({
  leadDetails: z.object({
    id: z.string().describe('Unique identifier for the lead.'),
    name: z.string().describe('Full name of the lead.'),
    email: z.string().email().describe('Email address of the lead.'),
    phone: z.string().optional().describe('Phone number of the lead.'),
    status: z.string().describe('Current status of the lead (e.g., New, Contacted, Qualified, Won, Lost).'),
    source: z.string().describe('Origin or source of the lead (e.g., Website, Referral, Cold Call).'),
    lastContactDate: z.string().optional().describe('Date of the last known interaction with the lead in ISO format.'),
    notes: z.string().optional().describe('General notes or comments associated with the lead.'),
  }).describe('Key details of the lead.'),
  interactionLogs: z.array(
    z.object({
      type: z.string().describe('Type of interaction (e.g., Call, Email, Meeting, Note).'),
      date: z.string().describe('Date and time of the interaction in ISO format.'),
      notes: z.string().describe('Summary or details of the interaction.'),
      agent: z.string().optional().describe('Name of the sales agent who performed the interaction.'),
    })
  ).describe('A chronological list of all recorded interactions with the lead.').default([]),
});
export type LeadInteractionSummaryInput = z.infer<typeof LeadInteractionSummaryInputSchema>;

const LeadInteractionSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, AI-generated summary of the lead\'s past interactions and key details.'),
});
export type LeadInteractionSummaryOutput = z.infer<typeof LeadInteractionSummaryOutputSchema>;

export async function getLeadInteractionSummary(input: LeadInteractionSummaryInput): Promise<LeadInteractionSummaryOutput> {
  return leadInteractionSummaryFlow(input);
}

const leadInteractionSummaryPrompt = ai.definePrompt({
  name: 'leadInteractionSummaryPrompt',
  input: { schema: LeadInteractionSummaryInputSchema },
  output: { schema: LeadInteractionSummaryOutputSchema },
  prompt: `You are an AI assistant designed to provide concise summaries of sales leads for sales executives.
Your goal is to quickly inform a sales executive about a lead's history and current status based on the provided details and interaction logs.
Focus on key details, important interactions, and the lead's current status, avoiding redundancy.

Lead Details:
ID: {{{leadDetails.id}}}
Name: {{{leadDetails.name}}}
Email: {{{leadDetails.email}}}
{{#if leadDetails.phone}}Phone: {{{leadDetails.phone}}}{{/if}}
Status: {{{leadDetails.status}}}
Source: {{{leadDetails.source}}}
{{#if leadDetails.lastContactDate}}Last Contact: {{{leadDetails.lastContactDate}}}{{/if}}
{{#if leadDetails.notes}}General Notes: {{{leadDetails.notes}}}{{/if}}

Interaction History:
{{#if interactionLogs.length}}
  {{#each interactionLogs}}
    - Type: {{{this.type}}}, Date: {{{this.date}}},{{#if this.agent}} Agent: {{{this.agent}}},{{/if}} Notes: {{{this.notes}}}
  {{/each}}
{{else}}
  No interaction logs available.
{{/if}}

Please provide a concise, AI-generated summary of this lead's past interactions and key details, enabling a sales executive to quickly understand their history and current status.`,
});

const leadInteractionSummaryFlow = ai.defineFlow(
  {
    name: 'leadInteractionSummaryFlow',
    inputSchema: LeadInteractionSummaryInputSchema,
    outputSchema: LeadInteractionSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await leadInteractionSummaryPrompt(input);
    return output!;
  }
);
