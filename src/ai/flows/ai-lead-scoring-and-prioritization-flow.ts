'use server';
/**
 * @fileOverview A Genkit flow for automatically scoring and prioritizing leads.
 *
 * - aiLeadScoringAndPrioritization - A function that handles the lead scoring and prioritization process.
 * - AiLeadScoringAndPrioritizationInput - The input type for the aiLeadScoringAndPrioritization function.
 * - AiLeadScoringAndPrioritizationOutput - The return type for the aiLeadScoringAndPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AiLeadScoringAndPrioritizationInputSchema = z.object({
  engagementScore: z.number().describe('A numerical score representing the lead\'s engagement with the product or company.'),
  leadSource: z.string().describe('The source from which the lead was acquired (e.g., "Website", "Google Ads", "Referral").'),
  demographicData: z.object({
    industry: z.string().optional().describe('The industry the lead operates in.'),
    companySize: z.string().optional().describe('The size of the lead\'s company (e.g., "Small", "Medium", "Enterprise").'),
    jobTitle: z.string().optional().describe('The job title of the lead.'),
    country: z.string().optional().describe('The country the lead is located in.'),
  }).describe('Demographic data about the lead.'),
  productAsked: z.string().optional().describe('The specific product or product category the lead has inquired about.'),
  leadStatus: z.string().optional().describe('The current status of the lead (e.g., "New", "Contacted", "Qualified").'),
  notes: z.string().optional().describe('Any additional notes or historical data about the lead.'),
});
export type AiLeadScoringAndPrioritizationInput = z.infer<typeof AiLeadScoringAndPrioritizationInputSchema>;

const AiLeadScoringAndPrioritizationOutputSchema = z.object({
  leadScore: z.number().describe('A numerical score from 0-100 indicating the quality and potential of the lead.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level assigned to the lead.'),
  reasoning: z.string().describe('A brief explanation for the assigned score and priority.'),
});
export type AiLeadScoringAndPrioritizationOutput = z.infer<typeof AiLeadScoringAndPrioritizationOutputSchema>;

export async function aiLeadScoringAndPrioritization(input: AiLeadScoringAndPrioritizationInput): Promise<AiLeadScoringAndPrioritizationOutput> {
  return aiLeadScoringAndPrioritizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiLeadScoringAndPrioritizationPrompt',
  input: { schema: AiLeadScoringAndPrioritizationInputSchema },
  output: { schema: AiLeadScoringAndPrioritizationOutputSchema },
  prompt: `You are an AI assistant specialized in lead scoring and prioritization for a company selling Ayurvedic wellness supplements. Your task is to evaluate leads based on provided data and assign a 'leadScore' (0-100) and 'priority' (High, Medium, Low).

Consider the following factors:
- **Engagement Score**: Higher scores indicate more interest.
- **Lead Source**: Some sources (e.g., direct website, referrals) might be more valuable than others (e.g., general ads).
- **Product Asked**: Specific interest in a high-value product should increase the score.
- **Demographic Data**: Align with the target customer profile for Ayurvedic supplements. For example, individuals in wellness-related industries, specific job titles, or certain company sizes might be more relevant.
- **Lead Status**: Leads that are further along in the sales process (e.g., 'Qualified') are generally higher priority.
- **Notes**: Any additional context that helps understand the lead's potential.

Provide a 'reasoning' explaining your score and priority.

Here is the lead data:
Engagement Score: {{{engagementScore}}}
Lead Source: {{{leadSource}}}
Product Asked: {{{productAsked}}}
Demographic Data:
  Industry: {{{demographicData.industry}}}
  Company Size: {{{demographicData.companySize}}}
  Job Title: {{{demographicData.jobTitle}}}
  Country: {{{demographicData.country}}}
Lead Status: {{{leadStatus}}}
Notes: {{{notes}}}`,
});

const aiLeadScoringAndPrioritizationFlow = ai.defineFlow(
  {
    name: 'aiLeadScoringAndPrioritizationFlow',
    inputSchema: AiLeadScoringAndPrioritizationInputSchema,
    outputSchema: AiLeadScoringAndPrioritizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
