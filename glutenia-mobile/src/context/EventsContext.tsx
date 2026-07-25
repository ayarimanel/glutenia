import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Event } from "../types/models";

const storageKey = (userId: string) => `glutenia.events.${userId}`;

export interface ParticipatingEvent {
  id: string;
  title: string;
  date: string;
  price: number;
  emoji: string;
  color: string;
  location: string;
}

export type EventInput = Pick<Event, "_id" | "title" | "date" | "price" | "emoji" | "color" | "location">;

export interface EventsContextValue {
  participatingEvents: ParticipatingEvent[];
  joinEvent: (event: EventInput) => void;
  leaveEvent: (eventId: string) => void;
  isGoing: (eventId: string) => boolean;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [participatingEvents, setParticipatingEvents] = useState<ParticipatingEvent[]>([]);

  useEffect(() => {
    setParticipatingEvents([]);
    if (!user?._id) return;
    const restore = async () => {
      const saved = await AsyncStorage.getItem(storageKey(user._id));
      if (saved) setParticipatingEvents(JSON.parse(saved));
    };
    restore();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    AsyncStorage.setItem(storageKey(user._id), JSON.stringify(participatingEvents));
  }, [participatingEvents, user?._id]);

  const joinEvent = (event: EventInput): void => {
    setParticipatingEvents((current) => {
      if (current.find((e) => e.id === event._id)) return current;
      return [
        ...current,
        {
          id: event._id,
          title: event.title,
          date: event.date,
          price: event.price,
          emoji: event.emoji,
          color: event.color,
          location: event.location,
        },
      ];
    });
  };

  const leaveEvent = (eventId: string): void => {
    setParticipatingEvents((current) => current.filter((e) => e.id !== eventId));
  };

  const isGoing = (eventId: string): boolean => participatingEvents.some((e) => e.id === eventId);

  const value = useMemo(
    () => ({ participatingEvents, joinEvent, leaveEvent, isGoing }),
    [participatingEvents]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

// Note: as of this migration, no screen actually calls useEvents() - this
// provider mounts and runs its restore/persist effects, but nothing reads
// from it. Flagging as dead code, not removing it - out of scope for a
// JS->TS conversion.
export const useEvents = (): EventsContextValue => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};
