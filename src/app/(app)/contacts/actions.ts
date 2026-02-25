'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateContactSchema = z.object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z.string().email('Invalid email address.'),
    phone: z.string().optional(),
    accountId: z.string().min(1, 'Account is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
    ownerId: z.string().min(1, 'Owner ID is required.'),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
type CreateContactResult = { success: boolean; error?: string; contactId?: string };

export async function createContact(values: CreateContactInput): Promise<CreateContactResult> {
    try {
        const validatedInput = CreateContactSchema.parse(values);

        const newContactRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('contacts').doc();
        const newContactId = newContactRef.id;
        
        const newContactData = {
            id: newContactId,
            ...validatedInput,
            phone: validatedInput.phone || '',
            avatar: `https://picsum.photos/seed/${newContactId}/100/100`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newContactRef.set(newContactData);
        
        revalidatePath('/contacts');

        return { success: true, contactId: newContactId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create contact: ${errorMessage}` };
    }
}
