'use client';

import { useState, useMemo } from 'react';

// ----- Types -----
export interface Commande {
  id: string;
  commandetotal: number;
  date: { seconds: number; nanoseconds: number };
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
  user: {
    displayName: string;
    phoneNumber: string;
    email?: string;
  };
  items: Array<{
    id?: string;
    nom: string;
    imageUrl: string;
    cartQuantity: number;
    prix: number;
    totalPrice: number;
  }>;
}

// Props pour le composant CommandesTable
interface CommandesTableProps {
  commandes: Commande[];
  onSelectCommande: (commande: Commande) => void;
}

// ----- Composant Badge de statut -----
interface StatusBadgeProps {
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
}
function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'En cours': 'bg-blue-100 text-blue-800',
    'Expédiée': 'bg-purple-100 text-purple-800',
    'Livrée': 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}

// Types pour les périodes
type Periode = '7j' | '30j' | '90j' | '365j' | 'all';

// Types pour le tri des produits
type TriProduits = 'quantite' | 'ventes' | 'nom';

// ----- Composant principal -----
export default function CommandesTable({ commandes, onSelectCommande }: CommandesTableProps) {
  const [sortField, setSortField] = useState<keyof Commande>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  
  // États pour les filtres
  const [periodeRecent, setPeriodeRecent] = useState<Periode>('7j');
  const [triProduits, setTriProduits] = useState<TriProduits>('quantite');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  // Calculer les dates en fonction de la période sélectionnée
  const getDateFromPeriode = (periode: Periode): Date => {
    const date = new Date();
    switch (periode) {
      case '7j':
        date.setDate(date.getDate() - 7);
        break;
      case '30j':
        date.setDate(date.getDate() - 30);
        break;
      case '90j':
        date.setDate(date.getDate() - 90);
        break;
      case '365j':
        date.setDate(date.getDate() - 365);
        break;
      case 'all':
        return new Date(0); // Date très ancienne
    }
    return date;
  };

  // Commandes récentes selon la période sélectionnée
  const recentCommandes = useMemo(() => {
    const dateLimite = getDateFromPeriode(periodeRecent);
    
    return commandes
      .filter(cmd => new Date(cmd.date.seconds * 1000) >= dateLimite)
      .sort((a, b) => new Date(b.date.seconds * 1000).getTime() - new Date(a.date.seconds * 1000).getTime());
  }, [commandes, periodeRecent]);

  // Tous les produits vendus avec filtres
  const allProduits = useMemo(() => {
    const compteur = new Map<string, { 
      nom: string; 
      imageUrl: string; 
      totalVentes: number; 
      totalQuantite: number;
      prix: number;
      derniereVente?: Date;
    }>();
    
    commandes.forEach(cmd => {
      cmd.items.forEach(item => {
        const key = item.nom;
        if (!compteur.has(key)) {
          compteur.set(key, { 
            nom: item.nom, 
            imageUrl: item.imageUrl || '/placeholder.jpg', 
            totalVentes: 0, 
            totalQuantite: 0,
            prix: item.prix,
            derniereVente: new Date(cmd.date.seconds * 1000)
          });
        }
        const prod = compteur.get(key)!;
        prod.totalVentes += item.totalPrice;
        prod.totalQuantite += item.cartQuantity;
        // Mettre à jour la dernière date de vente si plus récente
        const dateVente = new Date(cmd.date.seconds * 1000);
        if (!prod.derniereVente || dateVente > prod.derniereVente) {
          prod.derniereVente = dateVente;
        }
      });
    });
    
    let produits = Array.from(compteur.values());
    
    // Filtrer par recherche
    if (searchProduct.trim()) {
      const searchLower = searchProduct.toLowerCase();
      produits = produits.filter(prod => 
        prod.nom.toLowerCase().includes(searchLower)
      );
    }
    
    // Trier selon le critère sélectionné
    switch (triProduits) {
      case 'quantite':
        produits.sort((a, b) => b.totalQuantite - a.totalQuantite);
        break;
      case 'ventes':
        produits.sort((a, b) => b.totalVentes - a.totalVentes);
        break;
      case 'nom':
        produits.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
    }
    
    return produits;
  }, [commandes, triProduits, searchProduct]);

  // Produits à afficher (tous ou limités)
  const produitsAffiches = useMemo(() => {
    return showAllProducts ? allProduits : allProduits.slice(0, 8);
  }, [allProduits, showAllProducts]);

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

  // Tri des commandes
  const sortedCommandes = useMemo(() => {
    return [...commandes].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'commandetotal') {
        aValue = Number(a.commandetotal);
        bValue = Number(b.commandetotal);
      }
      
      if (sortField === 'date') {
        aValue = new Date(a.date.seconds * 1000);
        bValue = new Date(b.date.seconds * 1000);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [commandes, sortField, sortDirection]);

  const handleSort = (field: keyof Commande) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Nombre de commandes par période
  const statsPeriodes = useMemo(() => {
    const periodes: Record<Periode, string> = {
      '7j': '7 derniers jours',
      '30j': '30 derniers jours',
      '90j': '90 derniers jours',
      '365j': '365 derniers jours',
      'all': 'Tout le temps'
    };
    
    return Object.entries(periodes).map(([key, label]) => {
      const dateLimite = getDateFromPeriode(key as Periode);
      const count = commandes.filter(cmd => 
        new Date(cmd.date.seconds * 1000) >= dateLimite
      ).length;
      
      return { key: key as Periode, label, count };
    });
  }, [commandes]);

  return (
    <div className="space-y-6">
      {/* Table des commandes */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Toutes les commandes</h2>
            <div className="text-sm text-gray-600">
              {commandes.length} commandes
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('id')} 
                  className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  ID Commande
                </th>
                <th className="text-left p-4 font-medium text-gray-700">Client</th>
                <th 
                  onClick={() => handleSort('date')} 
                  className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Date
                </th>
                <th 
                  onClick={() => handleSort('commandetotal')} 
                  className="text-left p-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Total
                </th>
                <th className="text-left p-4 font-medium text-gray-700">Statut</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCommandes.slice(0, 10).map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      #{commande.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{commande.user.displayName}</div>
                      <div className="text-sm text-gray-500">{commande.user.phoneNumber}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(commande.date.seconds * 1000).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">
                      {commande.commandetotal.toLocaleString()} FCFA
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={commande.status} />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onSelectCommande(commande)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedCommandes.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-600">Modifiez vos critères de recherche ou de filtre</p>
            </div>
          )}
          
          {sortedCommandes.length > 10 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Voir toutes les commandes ({sortedCommandes.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deux colonnes : Historique + Produits populaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historique des commandes récentes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Commandes récentes</h2>
            <div className="flex flex-wrap gap-2">
              {statsPeriodes.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setPeriodeRecent(key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    periodeRecent === key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {recentCommandes.slice(0, 8).map((commande) => (
              <div 
                key={commande.id} 
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => onSelectCommande(commande)}
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {commande.user.displayName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(commande.date.seconds * 1000).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {commande.commandetotal.toLocaleString()} FCFA
                  </div>
                  <StatusBadge status={commande.status} />
                </div>
              </div>
            ))}
            
            {recentCommandes.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucune commande dans cette période</p>
              </div>
            )}
            
            {recentCommandes.length > 8 && (
              <div className="pt-4 border-t border-gray-200 text-center">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Voir les {recentCommandes.length} commandes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tous les produits vendus */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Produits vendus</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTriProduits('quantite')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    triProduits === 'quantite' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Qté
                </button>
                <button
                  onClick={() => setTriProduits('ventes')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    triProduits === 'ventes' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ventes
                </button>
                <button
                  onClick={() => setTriProduits('nom')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    triProduits === 'nom' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {produitsAffiches.map((produit, index) => (
              <div key={produit.nom} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    {produit.imageUrl ? (
                      <img 
                        src={produit.imageUrl} 
                        alt={produit.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {triProduits === 'quantite' && index < 3 && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{produit.nom}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-700">{produit.totalQuantite} vendus</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{produit.prix.toLocaleString()} FCFA/unité</span>
                    </div>
                    <span className="font-bold text-gray-900">{produit.totalVentes.toLocaleString()} FCFA</span>
                  </div>
                  {produit.derniereVente && (
                    <div className="text-xs text-gray-400 mt-1">
                      Dernière vente: {produit.derniereVente.toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {produitsAffiches.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  {searchProduct.trim() 
                    ? `Aucun produit trouvé pour "${searchProduct}"` 
                    : 'Aucun produit vendu'}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{allProduits.length} produits trouvés</span>
                {allProduits.length > 8 && (
                  <button
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAllProducts ? 'Voir moins' : `Voir tous (${allProduits.length})`}
                  </button>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {allProduits.reduce((sum, p) => sum + p.totalQuantite, 0)} unités vendues
                </div>
                <div className="text-xs text-gray-500">
                  Total: {allProduits.reduce((sum, p) => sum + p.totalVentes, 0).toLocaleString()} FCFA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails Commande */}
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
                        <StatusBadge status={selectedCommande.status} />
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
                            src={item.imageUrl || '/placeholder.jpg'} 
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}