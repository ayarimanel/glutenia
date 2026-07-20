import { createContext, useContext, useEffect, useState } from "react";
import GamificationToast from "../components/GamificationToast";
import GamificationUnlockModal from "../components/GamificationUnlockModal";

const GamificationContext = createContext({ notifyGamification: () => {} });

// Module-level trigger so screens can fire feedback without needing the hook
// wired into every component tree (mirrors AlertContext's Alert.alert override).
let globalTrigger = null;

// Call this with the `gamification` delta object returned alongside a scan,
// RSVP, or order API response. Safe to call with null/undefined.
export const notifyGamification = (delta) => {
  if (globalTrigger) globalTrigger(delta);
};

export function GamificationProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [modalQueue, setModalQueue] = useState([]);

  useEffect(() => {
    globalTrigger = (delta) => {
      if (!delta) return;

      if (delta.xpGained > 0) {
        setToast({ xpGained: delta.xpGained, key: Date.now() });
      }

      const events = [];
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
