'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import CommandesHeader from '@/components/CommandesHeader';
import CommandesTable from '@/components/CommandesTable';

// Types pour sécurité TypeScript
type StatutCommande = 'En cours' | 'Expédiée' | 'Livrée';

type Commande = {
  id: string;
  client: string;
  ville: string;
  produits: number;
  montant: string;
  date: string;
  statut: StatutCommande;
};

export default function CommandesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatutCommande>('all');

  const mockCommandes: Commande[] = [
    {
      id: '#AG-0128',
      client: 'Jean Ndong',
      ville: 'Libreville',
      produits: 3,
      montant: '28,500 XAF',
      date: '15/07/2023',
      statut: 'Livrée',
    },
    {
      id: '#AG-0127',
      client: 'Marie Mba',
      ville: 'Port-Gentil',
      produits: 2,
      montant: '15,750 XAF',
      date: '14/07/2023',
      statut: 'Expédiée',
    },
    {
      id: '#AG-0126',
      client: 'Paul Ondo',
      ville: 'Franceville',
      produits: 5,
      montant: '42,300 XAF',
      date: '13/07/2023',
      statut: 'En cours',
    },
    {
      id: '#AG-0125',
      client: 'Sophie Obiang',
      ville: 'Oyem',
      produits: 1,
      montant: '8,500 XAF',
      date: '12/07/2023',
      statut: 'Livrée',
    },
    {
      id: '#AG-0124',
      client: 'Pierre Mengue',
      ville: 'Lambaréné',
      produits: 4,
      montant: '33,200 XAF',
      date: '11/07/2023',
      statut: 'Expédiée',
    },
    {
      id: '#AG-0123',
      client: 'Fatou Diallo',
      ville: 'Libreville',
      produits: 2,
      montant: '19,800 XAF',
      date: '10/07/2023',
      statut: 'En cours',
    },
    {
      id: '#AG-0122',
      client: 'Emmanuel Nze',
      ville: 'Port-Gentil',
      produits: 6,
      montant: '54,600 XAF',
      date: '09/07/2023',
      statut: 'Livrée',
    },
    {
      id: '#AG-0121',
      client: 'Aminata Sow',
      ville: 'Franceville',
      produits: 3,
      montant: '26,400 XAF',
      date: '08/07/2023',
      statut: 'En cours',
    },
  ];

  const filteredCommandes = useMemo(() => {
    return mockCommandes.filter((commande) => {
      const matchesSearch =
        commande.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || commande.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <CommandesHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <div className="flex-1 p-6">
          <CommandesTable commandes={filteredCommandes} />
        </div>
      </div>
    </div>
  );
}
