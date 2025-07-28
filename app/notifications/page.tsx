'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'order' | 'client' | 'product' | 'system';
  title: string;
  message: string;
  date: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('date', 'desc'), orderBy('time', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Notification, 'id'>)
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
      // Le onSnapshot mettra à jour automatiquement la liste
    } catch (error) {
      console.error("Erreur lors du marquage comme lu :", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications :", error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return 'ri-shopping-cart-line';
      case 'client': return 'ri-user-line';
      case 'product': return 'ri-package-line';
      case 'system': return 'ri-settings-line';
      default: return 'ri-notification-line';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-green-600 bg-green-100';
      case 'client': return 'text-blue-600 bg-blue-100';
      case 'product': return 'text-purple-600 bg-purple-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-600 text-lg">Chargement des notifications...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-2">
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Toutes les notifications sont lues'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'unread'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Non lues ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('order')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'order'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Commandes
                </button>
                <button
                  onClick={() => setFilter('client')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'client'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => setFilter('product')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'product'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Produits
                </button>
                <button
                  onClick={() => setFilter('system')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === 'system'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Système
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="bg-white rounded-lg shadow-sm border">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="ri-notification-off-line w-16 h-16 flex items-center justify-center mx-auto mb-4 text-gray-400"></i>
                  <p>Aucune notification trouvée</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                          <i className={`${getNotificationIcon(notification.type)} w-5 h-5 flex items-center justify-center`}></i>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{notification.time}</span>
                              <span className="text-xs text-gray-500">{notification.date}</span>
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.read ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {notification.priority === 'high' ? 'Priorité haute' :
                               notification.priority === 'medium' ? 'Priorité moyenne' :
                               'Priorité basse'}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
