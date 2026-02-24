import { z } from 'zod';

export const LineItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string(),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
});
