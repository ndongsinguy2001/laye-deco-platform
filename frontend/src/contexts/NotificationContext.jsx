import React, { createContext, useState, useContext, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user.role);
      
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('🔌 Socket connecté');
      });

      socket.on('notification', (data) => {
        console.log('📨 Nouvelle notification:', data);
        setNotifications(prev => [{ ...data, read: false, id: Date.now() }, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('🔌 Socket déconnecté');
      });

      return () => {
        socket.off('connect');
        socket.off('notification');
        socket.off('disconnect');
        disconnectSocket();
      };
    }
  }, [user]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};