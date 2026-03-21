'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { X, BellRing } from 'lucide-react';

export function LeadAlertListener() {
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());
  // Use a slight buffer (5 seconds) to ensure we don't miss assignments happening during page load
  const sessionStartTime = useRef(Date.now() - 5000);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // High-quality notification sound for enterprise priority
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!currentUser || !currentTeamspace?.id) return;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // STRATEGIC QUERY: Listen for leads assigned to user
    const q = query(
      leadsRef, 
      where('assignedToIds', 'array-contains', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip initial load of existing documents to prevent alert spam
      if (snapshot.metadata.hasPendingWrites) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          // Determine timestamp safely for comparison
          const createdAtMillis = data.createdAt?.toMillis 
            ? data.createdAt.toMillis() 
            : new Date(data.createdAt).getTime();
          
          // Trigger alert only if lead was created after session start and hasn't been notified yet
          if (createdAtMillis > sessionStartTime.current && !notifiedIds.current.has(id)) {
            notifiedIds.current.add(id);
            setActiveAlert(`Strategic Priority: New Prospect Assigned - ${data.fullName}`);
            
            // Execute sound notification with browser policy handling
            audioRef.current?.play().catch(() => {
                // Silent catch: Browser blocked autoplay until user interaction
            });
            
            // Auto-hide alert after 10 seconds of visibility
            const timer = setTimeout(() => {
              setActiveAlert(null);
            }, 10000);
            
            return () => clearTimeout(timer);
          }
        }
      });
    }, (error) => {
        // Log errors only if they aren't standard permission denials during sign-out
        if (error.code !== 'permission-denied') {
            console.error("Alert Engine Handshake Failure:", error);
        }
    });

    return () => unsubscribe();
  }, [currentUser, currentTeamspace?.id, firestore]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none animate-in fade-in slide-in-from-top-10 duration-500">
      <div className="bg-destructive text-destructive-foreground px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.4)] flex items-center gap-4 border-2 border-white/20 backdrop-blur-3xl pointer-events-auto max-w-2xl w-full border-l-8">
        <div className="bg-white/20 p-3 rounded-xl animate-bounce">
          <BellRing className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black uppercase tracking-[0.2em] text-[10px] opacity-70 mb-0.5">High Intensity Assignment</p>
          <p className="font-bold text-lg leading-tight tracking-tight">{activeAlert}</p>
        </div>
        <button 
          onClick={() => setActiveAlert(null)}
          className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
