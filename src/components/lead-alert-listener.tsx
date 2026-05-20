'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { X, BellRing } from 'lucide-react';

export function LeadAlertListener() {
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // STRATEGIC REFACTOR: Listen to the user's notification collection directly.
    // This provides a much more reliable delivery mechanism than monitoring the leads collection.
    const notificationsRef = collection(firestore, 'users', currentUser.id, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip the initial state to prevent alerting for historical data on mount/refresh
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // Trigger the high-priority visual alert and audio ping
          setActiveAlert(data.description || data.title || 'Strategic Assignment Received');
          audioRef.current?.play().catch(() => {});
          
          const timer = setTimeout(() => {
            setActiveAlert(null);
          }, 8000);
          
          return () => clearTimeout(timer);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser, firestore]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none animate-in fade-in slide-in-from-top-10 duration-500">
      <div className="bg-destructive text-destructive-foreground px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.4)] flex items-center gap-4 border-2 border-white/20 backdrop-blur-3xl pointer-events-auto max-w-2xl w-full border-l-8">
        <div className="bg-white/20 p-3 rounded-xl animate-bounce">
          <BellRing className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 text-white">
          <p className="font-black uppercase tracking-[0.2em] text-[10px] opacity-70 mb-0.5">Action Alert</p>
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
