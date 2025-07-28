'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

// Configuration Firebase à adapter
const firebaseConfig = {
 apiKey: "AIzaSyAYRMKz-rdcDJ9_wSC4GPJ5Nr9JGHNf98s",
  authDomain: "ag02-9e907.firebaseapp.com",
  projectId: "ag02-9e907",
  storageBucket: "ag02-9e907.firebasestorage.app",

  messagingSenderId: "646527347928",
  appId: "1:646527347928:web:dca6972379e7f72027bbad",
  measurementId: "G-8MX1LYCXS6"
};

// Initialisation Firebase (éviter doublons)
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

interface ProductsHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export default function ProductsHeader({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory 
}: ProductsHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // On écoute en temps réel les notifications non lues
    const q = query(collection(db, 'notifications'), where('read', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error('Erreur en récupérant notifications :', error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">

        <div className="flex items-center space-x-4">
          <Link href="/ajouter-produit">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap cursor-pointer">
              Nouveau Produit
            </button>
          </Link>
        </div>

        <div className="relative">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
            onClick={() => alert('Ouvrir panneau notifications (à implémenter)')}
            aria-label="Notifications"
          >
            <i className="ri-notification-line w-5 h-5 flex items-center justify-center"></i>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
