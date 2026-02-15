'use server';

import { adminCreateUser, CreateUserInput } from '@/ai/flows/admin-create-user-flow';

type CreateUserResult = {
  success: boolean;
  error?: string;
};

export async function createUser(values: CreateUserInput): Promise<CreateUserResult> {
  try {
    await adminCreateUser(values);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'An unexpected error occurred.';
    if (error.message.includes('auth/email-already-exists')) {
      errorMessage = 'This email address is already in use by another account.';
    } else if (error.message.includes('auth/weak-password')) {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
    }

    return { success: false, error: errorMessage };
  }
}
