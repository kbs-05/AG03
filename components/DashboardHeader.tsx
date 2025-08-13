'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase config — à remplacer par la tienne
const firebaseConfig = {
  apiKey: "AIzaSyAYRMKz-rdcDJ9_wSC4GPJ5Nr9JGHNf98s",
  authDomain: "ag02-9e907.firebaseapp.com",
  projectId: "ag02-9e907",
  storageBucket: "ag02-9e907.firebasestorage.app",

  messagingSenderId: "646527347928",
  appId: "1:646527347928:web:dca6972379e7f72027bbad",
  measurementId: "G-8MX1LYCXS6"
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

export default function DashboardHeader() {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Tableau de bord</h2>
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
  );
}
