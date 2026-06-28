import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "glutenia.events";
const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const [participatingEvents, setParticipatingEvents] = useState([]);

  useEffect(() => {
    const restore = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setParticipatingEvents(JSON.parse(saved));
    };
    restore();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(participatingEvents));
  }, [participatingEvents]);

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
