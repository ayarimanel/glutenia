import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const storageKey = (userId) => `glutenia.events.${userId}`;
const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { user } = useAuth();
  const [participatingEvents, setParticipatingEvents] = useState([]);

  useEffect(() => {
    setParticipatingEvents([]);
    if (!user?.id) return;
    const restore = async () => {
      const saved = await AsyncStorage.getItem(storageKey(user.id));
      if (saved) setParticipatingEvents(JSON.parse(saved));
    };
    restore();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.setItem(storageKey(user.id), JSON.stringify(participatingEvents));
  }, [participatingEvents, user?.id]);

  const joinEvent = (event) => {
    setParticipatingEvents((current) => {
      if (current.find((e) => e.id === event.id)) return current;
      return [
        ...current,
        {
          id: event.id,
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

  const leaveEvent = (eventId) => {
    setParticipatingEvents((current) => current.filter((e) => e.id !== eventId));
  };

  const isGoing = (eventId) => participatingEvents.some((e) => e.id === eventId);

  const value = useMemo(
    () => ({ participatingEvents, joinEvent, leaveEvent, isGoing }),
    [participatingEvents]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = () => useContext(EventsContext);
