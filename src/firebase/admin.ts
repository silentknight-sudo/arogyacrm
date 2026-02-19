'use server';

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export function getAdminInstances() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp();
        } catch (e) {
            console.error('Firebase admin initialization error', e);
        }
    }
    return {
        adminAuth: admin.auth(),
        adminDb: admin.firestore(),
        FieldValue: admin.firestore.FieldValue,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp,
    };
}
