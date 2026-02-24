'use server';

import { adminDb, serverTimestamp } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateProductSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    sku: z.string().min(1, 'SKU is required.'),
    category: z.string().min(1, 'Category is required.'),
    price: z.coerce.number().min(0, 'Price must be a positive number.'),
    stock: z.coerce.number().min(0, 'Stock must be a positive number.'),
    imageUrl: z.string().url('Image URL must be a valid URL.'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
type CreateProductResult = { success: boolean; error?: string; productId?: string };

export async function createProduct(values: CreateProductInput): Promise<CreateProductResult> {
    try {
        const validatedInput = CreateProductSchema.parse(values);

        const newProductRef = adminDb.collection('products').doc();
        const newProductId = newProductRef.id;
        
        const newProductData = {
            id: newProductId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newProductRef.set(newProductData);
        
        revalidatePath('/inventory/products');

        return { success: true, productId: newProductId };

    } catch (error: any) {
        console.error('Error creating product:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create product: ${errorMessage}` };
    }
}
