'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Client {
  id: string;
  status?: string;
  createdAt?: { toDate: () => Date } | null;
  [key: string]: any;
}

interface Stat {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  bgColor: string;
  iconColor: string;
}

export default function ClientsStats() {
  const [stats, setStats] = useState<Stat[]>([
    {
      title: 'Clients actifs',
      value: '...',
      change: '...',
      changeType: 'positive',
      icon: 'ri-user-line',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Nouveaux clients',
      value: '...',
      change: '...',
      changeType: 'positive',
      icon: 'ri-user-add-line',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Clients inactifs',
      value: '...',
      change: '...',
      changeType: 'negative',
      icon: 'ri-user-unfollow-line',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  ]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'clients'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const clients = snapshot.docs.map(doc => {
          const data = doc.data() as Client;
         return {
  ...data,
  id: doc.id,
};

        });

        const actifs = clients.filter(client => client.status === 'actif').length;
        const inactifs = clients.filter(client => client.status === 'inactif').length;

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const nouveaux = clients.filter(client => {
          if (!client.createdAt) return false;
          const createdAtDate = client.createdAt.toDate();
          return createdAtDate >= lastMonth;
        }).length;

        // Pourcentages fixes (à adapter selon ton historique)
        const changeActifs = '+8% ce mois';
        const changeNouveaux = '+12% ce mois';
        const changeInactifs = '-3% ce mois';

        setStats([
          {
            title: 'Clients actifs',
            value: actifs.toString(),
            change: changeActifs,
            changeType: 'positive',
            icon: 'ri-user-line',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
          },
          {
            title: 'Nouveaux clients',
            value: nouveaux.toString(),
            change: changeNouveaux,
            changeType: 'positive',
            icon: 'ri-user-add-line',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
          },
          {
            title: 'Clients inactifs',
            value: inactifs.toString(),
            change: changeInactifs,
            changeType: 'negative',
            icon: 'ri-user-unfollow-line',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
          }
        ]);
      },
      (error) => {
        console.error("Erreur écoute clients:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
              <i className={`${stat.icon} ${stat.iconColor} w-6 h-6 flex items-center justify-center`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
