import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import GamificationToast from "../components/GamificationToast";
import GamificationUnlockModal from "../components/GamificationUnlockModal";
import type { BadgeSummary, GamificationDelta } from "../types/models";

export interface GamificationContextValue {
  notifyGamification: (delta: GamificationDelta | null | undefined) => void;
}

const GamificationContext = createContext<GamificationContextValue>({ notifyGamification: () => {} });

export type GamificationEvent =
  | { type: "badge"; badge: BadgeSummary }
  | { type: "levelup"; newLevel: number | undefined };

interface ToastState {
  xpGained: number;
  key: number;
}

// Module-level trigger so screens can fire feedback without needing the hook
// wired into every component tree (mirrors AlertContext's Alert.alert override).
let globalTrigger: ((delta: GamificationDelta | null | undefined) => void) | null = null;

// Call this with the `gamification` delta object returned alongside a scan,
// RSVP, or order API response. Safe to call with null/undefined.
export const notifyGamification = (delta: GamificationDelta | null | undefined): void => {
  if (globalTrigger) globalTrigger(delta);
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modalQueue, setModalQueue] = useState<GamificationEvent[]>([]);

  useEffect(() => {
    globalTrigger = (delta) => {
      if (!delta) return;

      if (delta.xpGained && delta.xpGained > 0) {
        setToast({ xpGained: delta.xpGained, key: Date.now() });
      }

      const events: GamificationEvent[] = [];
      (delta.badgesUnlocked || []).forEach((badge) => events.push({ type: "badge", badge }));
      if (delta.leveledUp) events.push({ type: "levelup", newLevel: delta.newLevel });

      if (events.length > 0) {
        setModalQueue((prev) => [...prev, ...events]);
      }
    };

    return () => {
      globalTrigger = null;
    };
  }, []);

  const dismissModal = () => {
    setModalQueue((prev) => prev.slice(1));
  };

  return (
    <GamificationContext.Provider value={{ notifyGamification }}>
      {children}
      {toast && <GamificationToast xpGained={toast.xpGained} key={toast.key} onDismiss={() => setToast(null)} />}
      {modalQueue.length > 0 && (
        <GamificationUnlockModal event={modalQueue[0]} onDismiss={dismissModal} />
      )}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  return useContext(GamificationContext);
}
