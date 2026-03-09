'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../schemas';


const CreateSalesOrderSchema = z.object({
    contactId: z.string().min(1, 'Contact is required.'),
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
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create sales order: ${errorMessage}` };
    }
}
