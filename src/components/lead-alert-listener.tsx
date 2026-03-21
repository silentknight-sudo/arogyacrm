
'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { AlertCircle, X, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeadAlertListener() {
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());
  const sessionStartTime = useRef(new Date());

  useEffect(() => {
    if (!currentUser || !currentTeamspace?.id) return;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // Listen for leads assigned to user, ordered by creation
    const q = query(
      leadsRef, 
      where('assignedToIds', 'array-contains', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const id = change.doc.id;
          
          // Determine timestamp safely
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          
          // Only alert for assignments that happened after the session started
          if (createdAt > sessionStartTime.current && !notifiedIds.current.has(id)) {
            notifiedIds.current.add(id);
            setActiveAlert(`Strategic Priority: New Prospect Assigned - ${data.fullName}`);
            
            // Auto-hide after 10 seconds to keep UI clean
            const timer = setTimeout(() => {
              setActiveAlert(null);
            }, 10000);
            
            return () => clearTimeout(timer);
          }
        }
      });
    }, (error) => {
        // Suppress initial permission errors during auth handshake
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
