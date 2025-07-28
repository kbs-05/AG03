'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';

// Config Firebase : remplace par ta config réelle
const firebaseConfig = {
  apiKey: "AIzaSyAYRMKz-rdcDJ9_wSC4GPJ5Nr9JGHNf98s",
  authDomain: "ag02-9e907.firebaseapp.com",
  projectId: "ag02-9e907",
  storageBucket: "ag02-9e907.firebasestorage.app",
  messagingSenderId: "646527347928",
  appId: "1:646527347928:web:dca6972379e7f72027bbad",
  measurementId: "G-8MX1LYCXS6"
};

// Initialisation Firebase (uniquement une fois)
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

interface Order {
  id: string;
  client: string;
  montant: string;
  statut: 'Livré' | 'En cours' | 'Expédié';
}

interface StatusBadgeProps {
  status: 'Livré' | 'En cours' | 'Expédié';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'Livré': 'bg-green-100 text-green-800',
    'En cours': 'bg-yellow-100 text-yellow-800',
    'Expédié': 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);

      try {
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'commandes'));
        const ordersData: Order[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            client: data.client ?? 'Inconnu',
            montant: data.montant ?? '0',
            statut: data.statut ?? 'En cours',
          } as Order;
        });
        setOrders(ordersData);
      } catch (err) {
        setError('Erreur lors du chargement des commandes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div>Chargement des commandes...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° COMMANDE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CLIENT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MONTANT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{order.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{order.client}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{order.montant}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.statut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
