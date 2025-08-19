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
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

  useEffect(() => {
    const fetchCommandes = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'commandes'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        const commandesData: Commande[] = snapshot.docs.map(doc => {
          const data = doc.data();

          const status = data.status;
          const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

          return {
            id: doc.id,
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
    setSelectedCommande(commande);
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

      {/* Modal Détails */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 p-6 relative max-h-[90vh] overflow-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setSelectedCommande(null)}
            >
              &times;
            </button>

            <h3 className="text-xl font-semibold mb-4">
              Détails commande #{selectedCommande.id}
            </h3>

            <div className="mb-4">
              <p><strong>Client :</strong> {selectedCommande.user.displayName}</p>
              <p><strong>Téléphone :</strong> {selectedCommande.user.phoneNumber}</p>
              <p><strong>Status :</strong> {selectedCommande.status}</p>
              <p><strong>Total :</strong> {selectedCommande.commandetotal} FCFA</p>
              <p><strong>Date :</strong> {new Date(selectedCommande.date.seconds * 1000).toLocaleString()}</p>
            </div>

            <h4 className="font-semibold mb-2">Articles :</h4>
            <table className="w-full text-sm border-t border-b border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Produit</th>
                  <th className="px-4 py-2 text-left">Quantité</th>
                  <th className="px-4 py-2 text-left">Prix unitaire</th>
                  <th className="px-4 py-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedCommande.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <img src={item.imageUrl} alt={item.nom} className="w-12 h-12 object-cover rounded"/>
                    </td>
                    <td className="px-4 py-2">{item.nom}</td>
                    <td className="px-4 py-2">{item.cartQuantity}</td>
                    <td className="px-4 py-2">{item.prix} FCFA</td>
                    <td className="px-4 py-2">{item.totalPrice} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
