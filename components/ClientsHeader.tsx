
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationPanel from './NotificationPanel';
import Link from 'next/link';

export default function ClientsHeader() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Gestion des Clients</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
              onClick={() => router.push('/notifications')}
            >
              <i className="ri-notification-line w-5 h-5 flex items-center justify-center"></i>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
            </button>
            
            <Link href="/nouveau-client">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap cursor-pointer">
                Nouveau Client
              </button>
            </Link>
            
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-green-600"></i>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </button>
          </div>
        </div>
      </header>

      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
}
