import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  date: string;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

type Action =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_READ'; id: string };

function notificationReducer(state: NotificationState, action: Action): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };
    default:
      return state;
  }
}

const NotificationContext = createContext<{
  state: NotificationState;
  setNotifications: (n: Notification[]) => void;
  markRead: (id: string) => void;
} | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const setNotifications = (notifications: Notification[]) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  };
  const markRead = (id: string) => {
    dispatch({ type: 'MARK_READ', id });
  };

  return (
    <NotificationContext.Provider value={{ state, setNotifications, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
