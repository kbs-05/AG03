'use client';

import { useState } from 'react';

interface Notification {
  id: string;
  type: 'order' | 'client' | 'product' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'Nouvelle commande',
      message: 'Commande #AG-0129 reçue de Jean Ndong',
      time: '5 min',
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'order',
      title: 'Commande expédiée',
      message: 'Commande #AG-0127 expédiée vers Port-Gentil',
      time: '1h',
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'client',
      title: 'Nouveau client',
      message: 'Restaurant Le Palmier s\'est inscrit',
      time: '2h',
      read: false,
      priority: 'low'
    },
    {
      id: '4',
      type: 'product',
      title: 'Stock faible',
      message: 'Produit "Huile de palme" en rupture de stock',
      time: '3h',
      read: true,
      priority: 'high'
    },
    {
      id: '5',
      type: 'system',
      title: 'Maintenance programmée',
      message: 'Maintenance système prévue dimanche 3h-5h',
      time: '1j',
      read: true,
      priority: 'medium'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return 'ri-shopping-cart-line';
      case 'client': return 'ri-user-line';
      case 'product': return 'ri-package-line';
      case 'system': return 'ri-settings-line';
      default: return 'ri-notification-line';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      <div 
        className="absolute top-16 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {unreadCount} nouvelles
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <i className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-500"></i>
              </button>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-green-600 hover:text-green-700 mt-2"
            >
              Marquer tout comme lu
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="ri-notification-off-line w-12 h-12 flex items-center justify-center mx-auto mb-3 text-gray-400"></i>
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'order' ? 'bg-green-100' :
                      notification.type === 'client' ? 'bg-blue-100' :
                      notification.type === 'product' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      <i className={`${getNotificationIcon(notification.type)} w-4 h-4 flex items-center justify-center ${
                        notification.type === 'order' ? 'text-green-600' :
                        notification.type === 'client' ? 'text-blue-600' :
                        notification.type === 'product' ? 'text-purple-600' :
                        'text-gray-600'
                      }`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-sm text-green-600 hover:text-green-700 font-medium">
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </div>
  );
}