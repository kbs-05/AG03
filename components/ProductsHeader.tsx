'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';

// --- Configuration Firebase ---
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
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Liste des catégories disponibles
  const categoryNames: Record<string, string> = {
    fruits: 'Fruits',
    legumes: 'Légumes',
    tubercules: 'Tubercules',
    cereales: 'Céréales',
    poissons: 'Poissons',
    viandes: 'Viandes',
    boissons: 'Boissons',
    confitures: 'Confitures',
  };

  // Recherche produits dès que searchTerm change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const q = query(
      collectionGroup(db, 'produits'),
      where('nom', '>=', searchTerm),
      where('nom', '<=', searchTerm + '\uf8ff')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuggestions(results);
      setShowSuggestions(true);
    });

    return () => unsubscribe();
  }, [searchTerm]);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowSuggestions(true)}
            placeholder="Rechercher un produit..."
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring focus:ring-green-200"
          />

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((prod) => (
                <li
                  key={prod.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSearchTerm(prod.nom);
                    setShowSuggestions(false);
                  }}
                >
                  {prod.nom} {prod.prix} {prod.unite}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filtre par catégorie */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Catégorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-green-200"
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(categoryNames).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Bouton nouveau produit */}
        <div>
          <Link href="/ajouter-produit">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap">
              Nouveau Produit
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}