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
  // Using a 30-second buffer to handle potential client/server clock drift more gracefully.
  const sessionStartTime = useRef(Date.now() - 30000);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!currentUser || !currentTeamspace?.id) return;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // We monitor for any lead where the current user is an assignee.
    // Ordering by updatedAt ensures that reassigned leads trigger the listener.
    const q = query(
      leadsRef, 
      where('assignedToIds', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Process doc changes to detect new assignments or reassignments
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          // Skip if we've already notified for this specific document update in this session
          if (notifiedIds.current.has(id)) return;

          // Resolve the best available timestamp
          let timestampMillis = 0;
          if (data.updatedAt instanceof Timestamp) {
            timestampMillis = data.updatedAt.toMillis();
          } else if (data.updatedAt) {
            timestampMillis = new Date(data.updatedAt).getTime();
          }

          // Trigger alert if the update happened recently (during this session)
          if (timestampMillis > sessionStartTime.current) {
            notifiedIds.current.add(id);
            
            const alertMsg = `Strategic Priority: New Prospect Assigned - ${data.fullName}`;
            
            // LOGIC: Only trigger the visual alert and sound if it's not a local write.
            // This ensures the RECIPIENT gets the alert, but the ASSIGNER doesn't get 
            // alerted for their own action.
            if (!snapshot.metadata.hasPendingWrites) {
                setActiveAlert(alertMsg);
                audioRef.current?.play().catch((err) => console.warn('Notification audio blocked:', err));
                
                const timer = setTimeout(() => {
                  setActiveAlert(null);
                }, 8000);
                
                // Cleanup timer on unmount or next change
                return () => clearTimeout(timer);
            }
            
            // ALWAYS add to the persistent notification panel for record keeping
            addNotification({
              title: 'New Prospect Assigned',
              description: `You have been assigned to ${data.fullName}. Take strategic action now.`,
              type: 'lead_assigned',
              link: '/leads'
            });
          }
        }
      });
    }, (error) => {
        // Log critical query errors (like missing indexes)
        if (error.code !== 'permission-denied') {
            console.error("CRITICAL_ALERT_ENGINE_ERROR:", error.message);
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
