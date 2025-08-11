'use client';

import { useEffect, useState } from "react";
import { fetchStats } from '@/lib/fetchStats'; // adapte le chemin selon ta structure

interface StatCardProps {
  title: string;
  value: string;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className={`flex items-center mt-2 text-sm`}>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatCardProps[]>([
    {
      title: 'Commandes',
      value: '...',
    },
    {
      title: 'Revenus',
      value: '...',
    },
    {
      title: 'Produits',
      value: '...',
    },
    {
      title: 'Clients',
      value: '...',
    }
  ]);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchStats();

        setStats([
          {
            title: 'Commandes',
            value: data.commandes.toString(),
          },
          {
            title: 'Revenus',
            value: `${(data.revenus / 1000).toFixed(1)}k XAF`,
          },
          {
            title: 'Produits',
            value: data.produits.toString(),
          },
          {
            title: 'Clients',
            value: data.clients.toString(),
          }
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
