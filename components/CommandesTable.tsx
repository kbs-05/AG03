'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/firebase';

export interface Commande {
  id: string;
  commandetotal: number;
  date: any; // Timestamp Firestore
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
  user: {
    displayName: string;
    phoneNumber: string;
  };
  items: {
    id: string;
    nom: string;
    imageUrl: string;
    cartQuantity: number;
    prix: number;
    totalPrice: number;
  }[];
}

interface StatusBadgeProps {
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'En cours': 'bg-orange-100 text-orange-800',
    'Expédiée': 'bg-blue-100 text-blue-800',
    'Livrée': 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function CommandesTable() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [sortField, setSortField] = useState<keyof Commande>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [historiqueVisible, setHistoriqueVisible] = useState(false);
  const [produitsVisibles, setProduitsVisibles] = useState(false);
  const [periode, setPeriode] = useState<'jour' | 'mois' | 'annee'>('jour');
  const [filtreDetail, setFiltreDetail] = useState<string | null>(null);
  const [openedGroups, setOpenedGroups] = useState<Set<string>>(new Set());

  // ----- Firestore realtime -----
  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const cmds: Commande[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Commande));
      setCommandes(cmds);
    });
    return () => unsubscribe();
  }, []);

  // ----- Tri -----
  const handleSort = (field: keyof Commande) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // ----- Historique -----
  const groupedByPeriode = useMemo(() => {
    const map = new Map<string, Commande[]>();
    for (const cmd of commandes) {
      const date = new Date(cmd.date.seconds * 1000);
      let key = '';
      if (periode === 'jour') key = date.toLocaleDateString();
      if (periode === 'mois') key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (periode === 'annee') key = `${date.getFullYear()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(cmd);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [commandes, periode]);

  const filteredGroups = useMemo(() => {
    if (!filtreDetail) return groupedByPeriode;
    return groupedByPeriode.filter(([label]) => label.includes(filtreDetail));
  }, [groupedByPeriode, filtreDetail]);

  const getStatusSummary = (group: Commande[]) => {
    const summary: Record<'Livrée' | 'En cours' | 'Expédiée' | 'En attente', number> = {
      Livrée: 0,
      'En cours': 0,
      Expédiée: 0,
      'En attente': 0,
    };
    group.forEach(cmd => summary[cmd.status]++);
    return summary;
  };

  const toggleGroup = (label: string) => {
    const newSet = new Set(openedGroups);
    if (openedGroups.has(label)) newSet.delete(label);
    else newSet.add(label);
    setOpenedGroups(newSet);
  };

  // ----- Produits les plus commandés -----
  const topProduits = useMemo(() => {
    const compteur = new Map<string, { nom: string; imageUrl: string; totalVentes: number; totalQuantite: number }>();
    commandes.forEach(cmd => {
      cmd.items.forEach(item => {
        if (!compteur.has(item.id)) {
          compteur.set(item.id, { nom: item.nom, imageUrl: item.imageUrl, totalVentes: 0, totalQuantite: 0 });
        }
        const prod = compteur.get(item.id)!;
        prod.totalVentes += item.totalPrice;
        prod.totalQuantite += item.cartQuantity;
      });
    });
    return Array.from(compteur.values())
      .sort((a, b) => b.totalQuantite - a.totalQuantite)
      .slice(0, 10);
  }, [commandes]);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-10 p-4">
      {/* TABLE PRINCIPALE */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Toutes les commandes</h3>
        <span className="text-sm text-gray-500">{commandes.length} commandes au total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => handleSort('id')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">N° COMMANDE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLIENT</th>
              <th onClick={() => handleSort('date')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">DATE</th>
              <th onClick={() => handleSort('commandetotal')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">MONTANT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCommandes.map((commande) => (
              <tr key={commande.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{commande.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{commande.user.displayName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(commande.date.seconds * 1000).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{commande.commandetotal.toLocaleString()} FCFA</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={commande.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => setSelectedCommande(commande)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600">Voir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== CARDS HISTORIQUE + PRODUITS ===== */}
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* CARD HISTORIQUE */}
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-xl">🕒</span>
              <h3 className="text-lg font-semibold text-blue-800">Historique des commandes</h3>
            </div>
            <button onClick={() => setHistoriqueVisible(!historiqueVisible)} className="text-blue-600 hover:underline text-sm font-medium">
              {historiqueVisible ? 'Masquer' : 'Voir'}
            </button>
          </div>

          {historiqueVisible && (
            <>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="text-sm text-gray-700">Afficher par :</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm" value={periode} onChange={e => { setPeriode(e.target.value as any); setFiltreDetail(null); }}>
                  <option value="jour">Jour</option>
                  <option value="mois">Mois</option>
                  <option value="annee">Année</option>
                </select>
                {periode === 'mois' && (
                  <select className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={e => setFiltreDetail(e.target.value)}>
                    <option value="">Tous les mois</option>
                    {[...Array(12)].map((_, i) => (<option key={i} value={`${i + 1}/`}>Mois {i + 1}</option>))}
                  </select>
                )}
                {periode === 'annee' && (
                  <select className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={e => setFiltreDetail(e.target.value)}>
                    <option value="">Toutes les années</option>
                    {Array.from(new Set(commandes.map(cmd => new Date(cmd.date.seconds * 1000).getFullYear()))).map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                )}
              </div>

              {filteredGroups.map(([label, group]) => {
                const total = group.reduce((acc, c) => acc + c.commandetotal, 0);
                const status = getStatusSummary(group);
                const isOpen = openedGroups.has(label);

                return (
                  <div key={label} className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleGroup(label)}>
                      <div className="flex gap-2 items-center">
                        <h4 className="font-semibold text-gray-800">{label}</h4>
                        <span className="text-sm text-gray-500">{group.length} commande(s)</span>
                      </div>
                      <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
                    </div>

                    <p className="text-sm text-gray-700 mb-1 mt-2">💰 Total ventes : <strong>{total.toLocaleString()} FCFA</strong></p>
                    <div className="flex gap-3 text-xs mt-2 flex-wrap mb-2">
                      {Object.entries(status).map(([key, val]) => (
                        <span key={key} className={`px-2 py-1 rounded-full ${key === 'Livrée' ? 'bg-green-100 text-green-800' : key === 'En cours' ? 'bg-orange-100 text-orange-800' : key === 'Expédiée' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{key}: {val}</span>
                      ))}
                    </div>

                    {/* Liste détaillée des commandes */}
                    {isOpen && (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-sm border-t border-b border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">N° Commande</th>
                              <th className="px-4 py-2 text-left">Client</th>
                              <th className="px-4 py-2 text-left">Date</th>
                              <th className="px-4 py-2 text-left">Montant</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.map((cmd) => (
                              <tr key={cmd.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{cmd.id}</td>
                                <td className="px-4 py-2">{cmd.user.displayName}</td>
                                <td className="px-4 py-2">{new Date(cmd.date.seconds * 1000).toLocaleString()}</td>
                                <td className="px-4 py-2">{cmd.commandetotal.toLocaleString()} FCFA</td>
                                <td className="px-4 py-2"><StatusBadge status={cmd.status} /></td>
                                <td className="px-4 py-2">
                                  <button onClick={() => setSelectedCommande(cmd)} className="text-blue-600 hover:underline text-sm">Voir</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* CARD PRODUITS */}
        <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 text-xl">📦</span>
              <h3 className="text-lg font-semibold text-yellow-800">Produits les plus commandés</h3>
            </div>
            <button onClick={() => setProduitsVisibles(!produitsVisibles)} className="text-yellow-600 hover:underline text-sm font-medium">
              {produitsVisibles ? 'Masquer' : 'Voir'}
            </button>
          </div>

          {produitsVisibles && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Image</th>
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-left">Quantité totale</th>
                    <th className="px-4 py-2 text-left">Montant total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProduits.map((prod, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <img src={prod.imageUrl} alt={prod.nom} className="w-10 h-10 object-cover rounded" />
                      </td>
                      <td className="px-4 py-2">{prod.nom}</td>
                      <td className="px-4 py-2">{prod.totalQuantite}</td>
                      <td className="px-4 py-2">{prod.totalVentes.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DÉTAILS COMMANDE */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 p-6 relative max-h-[90vh] overflow-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl" onClick={() => setSelectedCommande(null)}>&times;</button>

            <h3 className="text-xl font-semibold mb-4">Détails commande #{selectedCommande.id}</h3>
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
                {selectedCommande.items.map((item) => (
                  <tr key={item.id}>
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
