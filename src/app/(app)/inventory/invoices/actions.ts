'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../schemas';

const CreateInvoiceSchema = z.object({
    salesOrderId: z.string().min(1, 'Sales Order is required.'),
    invoiceDate: z.string().min(1, 'Invoice date is required.'),
    dueDate: z.string().min(1, 'Due date is required.'),
    status: z.enum(['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Voided']),
    totalAmount: z.coerce.number().min(0),
    paidAmount: z.coerce.number().min(0),
    lineItems: z.array(LineItemSchema),
    ownerId: z.string().min(1, 'Owner is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
type CreateInvoiceResult = { success: boolean; error?: string; invoiceId?: string };

export async function createInvoice(values: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    try {
        const validatedInput = CreateInvoiceSchema.parse(values);
        
        const newInvoiceRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('invoices').doc();
        const newInvoiceId = newInvoiceRef.id;

        const invoiceNumber = `INV-${Date.now()}`;
        
        const newInvoiceData = {
            id: newInvoiceId,
            ...validatedInput,
            invoiceNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newInvoiceRef.set(newInvoiceData);
        
        revalidatePath('/inventory/invoices');

        return { success: true, invoiceId: newInvoiceId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create invoice: ${errorMessage}` };
    }
}
    