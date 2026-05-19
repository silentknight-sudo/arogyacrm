'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx or error boundaries.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      console.error('FIRESTORE_PERMISSION_ERROR:', err);
      // Use setTimeout to defer the state update to the next tick.
      // This prevents the "Cannot update a component while rendering a different component" warning.
      setTimeout(() => {
        setError(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  useEffect(() => {
    if (!error) return;

    // Keep the app usable even when a background Firestore query is denied.
    // The failing hook already stores the error locally and clears its own data.
    setError(null);
  }, [error]);

  // This component renders nothing.
  return null;
}
