'use client';

import { useEffect, useState } from "react";
import { fetchStats } from '@/lib/fetchStats'; // adapte le chemin selon ta structure
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, isLoading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600">
              {icon}
            </div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatCardProps[]>([
    {
      title: 'Commandes',
      value: '...',
      icon: <ShoppingCart className="w-5 h-5" />,
      isLoading: true,
    },
    {
      title: 'Revenus',
      value: '...',
      icon: <TrendingUp className="w-5 h-5" />,
      isLoading: true,
    },
    {
      title: 'Produits',
      value: '...',
      icon: <Package className="w-5 h-5" />,
      isLoading: true,
    },
    {
      title: 'Clients',
      value: '...',
      icon: <Users className="w-5 h-5" />,
      isLoading: true,
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const data = await fetchStats();
        setStats([
          {
            title: 'Commandes',
            value: data.commandes.toLocaleString(),
            icon: <ShoppingCart className="w-5 h-5" />,
            isLoading: false,
          },
          {
            title: 'Revenus',
            value: `${(data.revenus / 1000).toFixed(1)}k XAF`,
            icon: <TrendingUp className="w-5 h-5" />,
            isLoading: false,
          },
          {
            title: 'Produits',
            value: data.produits.toLocaleString(),
            icon: <Package className="w-5 h-5" />,
            isLoading: false,
          },
          {
            title: 'Clients',
            value: data.clients.toLocaleString(),
            icon: <Users className="w-5 h-5" />,
            isLoading: false,
          }
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
        // Garder l'état de chargement ou afficher une erreur
        setStats(prev => prev.map(stat => ({
          ...stat,
          value: 'Erreur',
          isLoading: false
        })));
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}