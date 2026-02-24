'use server';

import { adminDb, serverTimestamp } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateTaskSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters.'),
    description: z.string().optional(),
    status: z.enum(['Todo', 'In Progress', 'Done']),
    priority: z.enum(['Low', 'Medium', 'High']),
    dueDate: z.string().min(1, 'Due date is required.'),
    assignedToId: z.string().min(1, 'Must be assigned to a user.'),
    teamspaceId: z.string().min(1, 'Must belong to a teamspace.'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
type CreateTaskResult = { success: boolean; error?: string; taskId?: string };

export async function createTask(values: CreateTaskInput): Promise<CreateTaskResult> {
    try {
        const validatedInput = CreateTaskSchema.parse(values);

        const newTaskRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('tasks').doc();
        const newTaskId = newTaskRef.id;
        
        const newTaskData = {
            id: newTaskId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newTaskRef.set(newTaskData);
        
        revalidatePath('/tasks');

        return { success: true, taskId: newTaskId };

    } catch (error: any) {
        console.error('Error creating task:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create task: ${errorMessage}` };
    }
}
