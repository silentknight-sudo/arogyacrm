'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, limit, orderBy, Timestamp } from 'firebase/firestore';
import { X, BellRing } from 'lucide-react';

export function LeadAlertListener() {
  const { currentUser, currentTeamspace, addNotification } = useApp();
  const firestore = useFirestore();
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());
  
  // sessionStartTime ensures we don't alert for historical data on initial load.
  // Using a 10-second buffer to handle potential client/server clock drift.
  const sessionStartTime = useRef(Date.now() - 10000);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!currentUser || !currentTeamspace?.id) return;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // We order by updatedAt to catch both new creations and reassignment updates.
    // Reassigned leads will move to the top of this query result.
    const q = query(
      leadsRef, 
      where('assignedToIds', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip updates triggered by local user actions to prevent duplicate alerts
      if (snapshot.metadata.hasPendingWrites) return;

      snapshot.docChanges().forEach((change) => {
        // In Firestore, 'added' means the document newly matches the query filters.
        // This is perfect for detecting when a lead is newly assigned to the user.
        if (change.type === 'added') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          // Determine the most accurate timestamp available
          let timestampMillis = 0;
          if (data.updatedAt instanceof Timestamp) {
            timestampMillis = data.updatedAt.toMillis();
          } else if (data.updatedAt) {
            timestampMillis = new Date(data.updatedAt).getTime();
          } else if (data.createdAt instanceof Timestamp) {
            timestampMillis = data.createdAt.toMillis();
          } else if (data.createdAt) {
            timestampMillis = new Date(data.createdAt).getTime();
          }

          // Trigger alert if the assignment happened during this session
          if (timestampMillis > sessionStartTime.current && !notifiedIds.current.has(id)) {
            notifiedIds.current.add(id);
            
            const alertMsg = `Strategic Priority: New Prospect Assigned - ${data.fullName}`;
            setActiveAlert(alertMsg);
            
            // Log to global header notification list
            addNotification({
              title: 'New Prospect Assigned',
              description: `You have been assigned to ${data.fullName}. Take strategic action now.`,
              type: 'lead_assigned',
              link: '/leads'
            });
            
            // Audio-visual execution
            audioRef.current?.play().catch((err) => console.warn('Notification audio blocked:', err));
            
            const timer = setTimeout(() => {
              setActiveAlert(null);
            }, 8000);
            
            return () => clearTimeout(timer);
          }
        }
      });
    }, (error) => {
        // Log errors except for expected transient permission denials during auth transitions
        if (error.code !== 'permission-denied') {
            console.error("ALERT_ENGINE_ERROR:", error);
        }
    });

    return () => unsubscribe();
  }, [currentUser, currentTeamspace?.id, firestore, addNotification]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none animate-in fade-in slide-in-from-top-10 duration-500">
      <div className="bg-destructive text-destructive-foreground px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.4)] flex items-center gap-4 border-2 border-white/20 backdrop-blur-3xl pointer-events-auto max-w-2xl w-full border-l-8">
        <div className="bg-white/20 p-3 rounded-xl animate-bounce">
          <BellRing className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 text-white">
          <p className="font-black uppercase tracking-[0.2em] text-[10px] opacity-70 mb-0.5">High Intensity Assignment</p>
          <p className="font-bold text-lg leading-tight tracking-tight">{activeAlert}</p>
        </div>
        <button 
          onClick={() => setActiveAlert(null)}
          className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}