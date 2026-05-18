'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's error boundaries.
 * 
 * FIX: Defers state update and error throwing to avoid React render-cycle warnings.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Defer the state update to ensure it happens after the current render cycle
      setTimeout(() => {
        setError(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Use a second effect to throw the error safely after hydration/render
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return null;
}