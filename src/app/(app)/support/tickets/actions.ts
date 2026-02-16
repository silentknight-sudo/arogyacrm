
'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateTicketSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    category: z.string().min(1, 'Category is required.'),
    status: z.enum(['Open', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed']),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
    contactId: z.string().min(1, 'Contact is required.'),
    assignedToId: z.string().min(1, 'Must be assigned to a user.'),
    teamspaceId: z.string().min(1, 'Must belong to a teamspace.'),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
type CreateTicketResult = { success: boolean; error?: string; ticketId?: string };

export async function createTicket(values: CreateTicketInput): Promise<CreateTicketResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateTicketSchema.parse(values);

        const newTicketRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('tickets').doc();
        const newTicketId = newTicketRef.id;
        
        const newTicketData = {
            id: newTicketId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newTicketRef.set(newTicketData);
        
        revalidatePath('/support/tickets');

        return { success: true, ticketId: newTicketId };

    } catch (error: any) {
        console.error('Error creating ticket:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create ticket: ${errorMessage}` };
    }
}
