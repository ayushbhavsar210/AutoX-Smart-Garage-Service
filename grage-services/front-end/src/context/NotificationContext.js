import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '../utils/apiService';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

export function NotificationProvider({ children }) {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const normalizeNotification = (record = {}) => ({
    ...record,
    id: record.id ?? record._id ?? Date.now(),
    timestamp: record.timestamp || record.createdAt || new Date().toISOString(),
  });

  const resolveNumericUserId = (authUser) => {
    const preferred = Number(authUser?.userId);
    if (Number.isFinite(preferred)) return preferred;
    const fallback = Number(authUser?.id);
    return Number.isFinite(fallback) ? fallback : null;
  };

  // Load notifications from localStorage on mount
  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!user) {
        if (active) {
          setNotifications([]);
        }
        return;
      }

      try {
        const response = await notificationApi.listMine();
        const records = Array.isArray(response?.data) ? response.data : [];
        if (active) {
          setNotifications(records.map(normalizeNotification));
        }
      } catch (_error) {
        const storageKey = `notifications_${role}_${user.userId || user.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            if (active) {
              const parsed = JSON.parse(stored);
              setNotifications(Array.isArray(parsed) ? parsed.map(normalizeNotification) : []);
            }
          } catch (_e) {
            if (active) {
              setNotifications([]);
            }
          }
        } else if (active) {
          setNotifications(getDemoNotifications(role));
        }
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [user, role]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user) {
      const storageKey = `notifications_${role}_${user.userId || user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }, [notifications, user, role]);

  const getDemoNotifications = (userRole) => {
    const now = new Date();
    if (userRole === 'admin') {
      return [
        {
          id: Date.now() + 1,
          type: 'booking',
          title: 'New Booking Created',
          message: 'Customer John Doe booked Oil Change service',
          timestamp: new Date(now - 5 * 60000).toISOString(),
          read: false,
          icon: '📅',
        },
        {
          id: Date.now() + 2,
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of ₹2,500 received for Invoice #1234',
          timestamp: new Date(now - 15 * 60000).toISOString(),
          read: false,
          icon: '💰',
        },
        {
          id: Date.now() + 3,
          type: 'service',
          title: 'Service Completed',
          message: 'Brake Inspection completed for GJ-01-AB-1234',
          timestamp: new Date(now - 30 * 60000).toISOString(),
          read: false,
          icon: '✅',
        },
        {
          id: Date.now() + 4,
          type: 'mechanic',
          title: 'Mechanic Assigned',
          message: 'Rajesh Kumar assigned to service #5678',
          timestamp: new Date(now - 45 * 60000).toISOString(),
          read: true,
          icon: '🔧',
        },
      ];
    } else {
      return [
        {
          id: Date.now() + 1,
          type: 'booking',
          title: 'Booking Confirmed',
          message: 'Your Oil Change service is scheduled for tomorrow',
          timestamp: new Date(now - 10 * 60000).toISOString(),
          read: false,
          icon: '✅',
        },
        {
          id: Date.now() + 2,
          type: 'payment',
          title: 'Payment Successful',
          message: 'Payment of ₹2,500 processed successfully',
          timestamp: new Date(now - 20 * 60000).toISOString(),
          read: false,
          icon: '💳',
        },
        {
          id: Date.now() + 3,
          type: 'service',
          title: 'Service Completed',
          message: 'Your vehicle service has been completed',
          timestamp: new Date(now - 60 * 60000).toISOString(),
          read: false,
          icon: '🎉',
        },
        {
          id: Date.now() + 4,
          type: 'mechanic',
          title: 'Mechanic Assigned',
          message: 'Mechanic Amit is on the way to your location',
          timestamp: new Date(now - 90 * 60000).toISOString(),
          read: true,
          icon: '🚗',
        },
      ];
    }
  };

  const addNotification = async (notification) => {
    let icon = notification.icon;
    if (!icon) {
      if (notification.type === 'booking') icon = '📅';
      else if (notification.type === 'payment') icon = '💰';
      else if (notification.type === 'service') icon = '✅';
      else if (notification.type === 'mechanic') icon = '🔧';
      else icon = '📋';
    }
    
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
      icon,
    };

    try {
      const numericUserId = resolveNumericUserId(user);
      if (numericUserId !== null) {
        const response = await notificationApi.send({
          userId: numericUserId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
        });

        const createdNotification = response?.data
          ? normalizeNotification(response.data)
          : newNotification;
        setNotifications((prev) => [createdNotification, ...prev]);
        return createdNotification;
      }
    } catch (_error) {
      // fallback to local notification list
    }

    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markRead(notificationId);
    } catch (_error) {
      // fallback to local update
    }

    setNotifications((prev) => prev.map((notif) =>
      String(notif.id) === String(notificationId) ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllRead();
      if (response?.success && Array.isArray(response?.data)) {
        setNotifications(response.data.map(normalizeNotification));
        return;
      }
    } catch (_error) {
      // fallback to local update
    }

    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
