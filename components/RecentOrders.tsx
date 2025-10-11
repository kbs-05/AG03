'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';

// Config Firebase (à garder)
const firebaseConfig = {
  apiKey: "AIzaSyAYRMKz-rdcDJ9_wSC4GPJ5Nr9JGHNf98s",
  authDomain: "ag02-9e907.firebaseapp.com",
  projectId: "ag02-9e907",
  storageBucket: "ag02-9e907.firebasestorage.app",
  messagingSenderId: "646527347928",
  appId: "1:646527347928:web:dca6972379e7f72027bbad",
  measurementId: "G-8MX1LYCXS6"
};

// Initialisation Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

interface Product {
  id: string;
  nom: string;
  likes: number;
  commandes: number;
  prix: string;
  image?: string;
}

export default function TopProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        // 🔥 On suppose que ta collection s'appelle "produits"
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'produits'));

        // On récupère les données et on les trie
        const productsData: Product[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nom: data.nom ?? 'Produit inconnu',
            likes: data.likes ?? 0,
            commandes: data.commandes ?? 0,
            prix: data.prix ?? '0',
            image: data.image ?? '',
          } as Product;
        });

        // 🔽 Tri : d'abord par commandes, puis par likes
        const sorted = productsData.sort((a, b) => (b.commandes + b.likes) - (a.commandes + a.likes));

        setProducts(sorted.slice(0, 10)); // On garde les 10 meilleurs
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des produits.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>Chargement des produits...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Produits les plus populaires</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMAGE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUIT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMMANDES</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LIKES</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRIX</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.image ? (
                    <img src={product.image} alt={product.nom} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.nom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {product.commandes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {product.likes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.prix} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
