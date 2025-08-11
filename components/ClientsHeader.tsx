
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientsHeader() {
  const router = useRouter();

  return (
    <>
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Gestion des Clients</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-green-600"></i>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
