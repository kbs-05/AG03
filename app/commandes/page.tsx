'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import CommandesHeader from '@/components/CommandesHeader';
import CommandesTable, { Commande } from '@/components/CommandesTable';

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type StatutCommande = 'all' | 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';

export default function CommandesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatutCommande>('all');
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

          // Normalisation du statut (première lettre en majuscule)
          const status = data.status;
          const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

          return {
            id: data.id,
            commandetotal: data.commandetotal,
            date: data.date,
            status: formattedStatus as 'En attente' | 'En cours' | 'Expédiée' | 'Livrée',
            user: {
              displayName: data.user.displayName,
              phoneNumber: data.user.phoneNumber,
            },
            items: data.items,
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
    return commandes.filter(commande => {
      const matchesSearch =
        commande.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || commande.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [commandes, searchTerm, statusFilter]);

  const handleSelectCommande = (commande: Commande) => {
    console.log('Voir les détails de la commande :', commande);
    // tu peux ouvrir un modal ou rediriger vers une page détail
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="text-gray-700">Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <CommandesHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          allStatuses={['En attente', 'En cours', 'Expédiée', 'Livrée']}
        />

        <div className="flex-1 p-6 overflow-auto">
          <CommandesTable commandes={filteredCommandes} onSelectCommande={handleSelectCommande} />
        </div>
      </div>
    </div>
  );
}
