'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../schemas';


const CreateSalesOrderSchema = z.object({
    accountId: z.string().min(1, 'Account is required.'),
    contactId: z.string().optional(),
    orderDate: z.string().min(1, 'Order date is required.'),
    status: z.enum(['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled']),
    lineItems: z.array(LineItemSchema).min(1, 'Sales Order must have at least one line item.'),
    ownerId: z.string().min(1, 'Owner is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderSchema>;
type CreateSalesOrderResult = { success: boolean; error?: string; salesOrderId?: string };

export async function createSalesOrder(values: CreateSalesOrderInput): Promise<CreateSalesOrderResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateSalesOrderSchema.parse(values);

        const newSalesOrderRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('salesOrders').doc();
        const newSalesOrderId = newSalesOrderRef.id;
        
        const totalAmount = validatedInput.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
        const orderNumber = `SO-${Date.now()}`;
        
        const newSalesOrderData = {
            id: newSalesOrderId,
            ...validatedInput,
            totalAmount,
            orderNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newSalesOrderRef.set(newSalesOrderData);
        
        revalidatePath('/inventory/sales-orders');

        return { success: true, salesOrderId: newSalesOrderId };

    } catch (error: any) {
        console.error('Error creating sales order:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create sales order: ${errorMessage}` };
    }
}
    