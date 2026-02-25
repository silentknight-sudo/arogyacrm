'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateMeetingSchema = z.object({
    title: z.string().min(2, 'Title is required.'),
    description: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),
    location: z.string().min(1, 'Location is required.'),
    organizerId: z.string().min(1, 'Organizer is required.'),
    attendeeIds: z.array(z.string()).optional(),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
type CreateMeetingResult = { success: boolean; error?: string; meetingId?: string };

export async function createMeeting(values: CreateMeetingInput): Promise<CreateMeetingResult> {
    try {
        const validatedInput = CreateMeetingSchema.parse(values);

        const newMeetingRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('meetings').doc();
        const newMeetingId = newMeetingRef.id;
        
        const newMeetingData = {
            id: newMeetingId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newMeetingRef.set(newMeetingData);
        
        revalidatePath('/meetings');

        return { success: true, meetingId: newMeetingId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create meeting: ${errorMessage}` };
    }
}
