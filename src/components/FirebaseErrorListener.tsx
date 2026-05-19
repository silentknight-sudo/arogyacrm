'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Listens for Firestore permission errors without crashing the whole app.
 * The failing hook already keeps the error locally, so we only log it here.
 */
export function FirebaseErrorListener() {
  const [lastError, setLastError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      console.error('FIRESTORE_PERMISSION_ERROR:', err);
      setTimeout(() => {
        setLastError(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  useEffect(() => {
    if (!lastError) return;
    setLastError(null);
  }, [lastError]);

  return null;
}