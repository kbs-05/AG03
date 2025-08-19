'use client';

import { useState } from 'react';

export interface Commande {
  id: string;
  commandetotal: number;
  date: any; // Timestamp Firestore
  status: 'En attente' | 'En cours' | 'Expédiée' | 'Livrée';
  user: {
    displayName: string;
    phoneNumber: string;
  };
  items: any[];
}

interface CommandesTableProps {
  commandes: Commande[];
  onSelectCommande: (commande: Commande) => void;
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

export default function CommandesTable({ commandes, onSelectCommande }: CommandesTableProps) {
  const [sortField, setSortField] = useState<keyof Commande>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Commande) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCommandes = [...commandes].sort((a, b) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Toutes les commandes</h3>
        <span className="text-sm text-gray-500">{commandes.length} commandes au total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => handleSort('id')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                N° COMMANDE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLIENT</th>
              <th onClick={() => handleSort('date')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                DATE
              </th>
              <th onClick={() => handleSort('commandetotal')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer">
                MONTANT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCommandes.map((commande) => (
              <tr key={commande.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{commande.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{commande.user.displayName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(commande.date.seconds * 1000).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{commande.commandetotal}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={commande.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onSelectCommande(commande)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600"
                  >
                    <i className="ri-eye-line w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCommandes.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-file-list-3-line w-12 h-12 mx-auto text-gray-400 mb-4"></i>
          <p className="text-gray-500">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
