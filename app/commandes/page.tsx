'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import CommandesTable from '@/components/CommandesTable'; // Import ajouté
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type StatutCommande = 'all' | 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';

export type Commande = {
  id: string;
  commandetotal: number;
  date: { seconds: number; nanoseconds: number };
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
  user: {
    displayName: string;
    phoneNumber: string;
  };
  items: Array<{
    nom: string;
    cartQuantity: number;
    prix: number;
    totalPrice: number;
    imageUrl: string;
  }>;
};

export default function CommandesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatutCommande>('all');
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

  // Stats calculées
  const stats = useMemo(() => {
    const total = commandes.length;
    const totalRevenue = commandes.reduce((sum, cmd) => sum + cmd.commandetotal, 0);
    const pending = commandes.filter(cmd => cmd.status === 'En attente').length;
    const inProgress = commandes.filter(cmd => cmd.status === 'En cours').length;
    const shipped = commandes.filter(cmd => cmd.status === 'Expédiée').length;
    const delivered = commandes.filter(cmd => cmd.status === 'Livrée').length;

    return { total, totalRevenue, pending, inProgress, shipped, delivered };
  }, [commandes]);

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
            items: data.items || [],
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
        commande.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.user.phoneNumber.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || commande.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [commandes, searchTerm, statusFilter]);

  const handleSelectCommande = (commande: Commande) => {
    setSelectedCommande(commande);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des commandes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
              <p className="text-gray-600 mt-1">Suivez et gérez toutes vos commandes</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{commandes.length}</span> commandes
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En cours</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expédiées</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Livrées</p>
                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher une commande par ID, client ou téléphone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setStatusFilter('En attente')}
                    className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'En attente' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                  >
                    En attente
                  </button>
                  <button
                    onClick={() => setStatusFilter('En cours')}
                    className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'En cours' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  >
                    En cours
                  </button>
                  <button
                    onClick={() => setStatusFilter('Expédiée')}
                    className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'Expédiée' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  >
                    Expédiées
                  </button>
                  <button
                    onClick={() => setStatusFilter('Livrée')}
                    className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'Livrée' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    Livrées
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>{filteredCommandes.length} commande(s) trouvée(s)</span>
                <span className="font-medium">Total filtré: {filteredCommandes.reduce((sum, cmd) => sum + cmd.commandetotal, 0).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Table des commandes - Composant CommandesTable */}
            <CommandesTable 
              commandes={filteredCommandes} 
              onSelectCommande={handleSelectCommande} 
            />
          </div>
        </main>
      </div>

      {/* Modal Détails */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Commande #{selectedCommande.id}</h2>
                    <p className="text-blue-100 text-sm">
                      {new Date(selectedCommande.date.seconds * 1000).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommande(null)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations client */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations client</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Nom du client</div>
                          <div className="font-medium">{selectedCommande.user.displayName}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Téléphone</div>
                          <div className="font-medium">{selectedCommande.user.phoneNumber}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Résumé commande */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la commande</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-600">Statut</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          selectedCommande.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                          selectedCommande.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                          selectedCommande.status === 'Expédiée' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedCommande.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total commande</span>
                        <span className="text-xl font-bold text-gray-900">{selectedCommande.commandetotal.toLocaleString()} FCFA</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Nombre d'articles</span>
                        <span className="font-medium">{selectedCommande.items.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des articles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles commandés</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {selectedCommande.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.nom}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.nom}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-600">
                              {item.cartQuantity} × {item.prix.toLocaleString()} FCFA
                            </div>
                            <div className="font-bold text-gray-900">
                              {item.totalPrice.toLocaleString()} FCFA
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedCommande.commandetotal.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors font-medium">
                        Mettre à jour le statut
                      </button>
                      <button className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                        Télécharger la facture
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}