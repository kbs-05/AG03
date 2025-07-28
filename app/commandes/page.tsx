'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import CommandesHeader from '@/components/CommandesHeader';
import CommandesTable from '@/components/CommandesTable';

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types pour sécurité TypeScript
type StatutCommande = 'En cours' | 'Expédiée' | 'Livrée';

export type Commande = {
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
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandes = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'commandes'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        const commandesData: Commande[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            client: data.client,
            ville: data.ville,
            produits: data.produits,
            montant: data.montant,
            date: data.date,
            statut: data.statut,
          } as Commande;
        });
        setCommandes(commandesData);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommandes();
  }, []);

  const filteredCommandes = useMemo(() => {
    return commandes.filter((commande) => {
      const matchesSearch =
        commande.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || commande.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [commandes, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="text-gray-700">Chargement des commandes...</div>
      </div>
    );
  }

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
