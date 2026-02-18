
'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../schemas';

const CreatePurchaseOrderSchema = z.object({
    supplierName: z.string().min(2, 'Supplier name is required.'),
    orderDate: z.string().min(1, 'Order date is required.'),
    expectedDeliveryDate: z.string().min(1, 'Expected delivery date is required.'),
    status: z.enum(['Pending', 'Ordered', 'Received', 'Cancelled']),
    lineItems: z.array(LineItemSchema).min(1, 'Purchase Order must have at least one line item.'),
    ownerId: z.string().min(1, 'Owner is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
type CreatePurchaseOrderResult = { success: boolean; error?: string; purchaseOrderId?: string };

export async function createPurchaseOrder(values: CreatePurchaseOrderInput): Promise<CreatePurchaseOrderResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreatePurchaseOrderSchema.parse(values);

        const newPurchaseOrderRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('purchaseOrders').doc();
        const newPurchaseOrderId = newPurchaseOrderRef.id;
        
        const totalAmount = validatedInput.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
        const orderNumber = `PO-${Date.now()}`;
        
        const newPurchaseOrderData = {
            id: newPurchaseOrderId,
            ...validatedInput,
            totalAmount,
            orderNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newPurchaseOrderRef.set(newPurchaseOrderData);
        
        revalidatePath('/inventory/purchase-orders');

        return { success: true, purchaseOrderId: newPurchaseOrderId };

    } catch (error: any) {
        console.error('Error creating purchase order:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create purchase order: ${errorMessage}` };
    }
}
    
