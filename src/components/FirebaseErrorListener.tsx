'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Hyper-Resilient Error Boundary Bridge.
 * Ensures Firestore permission errors are thrown safely outside the render cycle.
 */
export function FirebaseErrorListener() {
  const [errorToThrow, setErrorToThrow] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Defer state update to avoid React's "update during render" warning.
      setTimeout(() => {
        setErrorToThrow(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  // Throw error in effect to let ErrorBoundary catch it safely
  useEffect(() => {
    if (errorToThrow) {
      throw errorToThrow;
    }
  }, [errorToThrow]);

  return null;
}