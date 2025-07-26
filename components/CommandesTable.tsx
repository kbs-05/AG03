
'use client';

import { useState } from 'react';

interface Commande {
  id: string;
  client: string;
  ville: string;
  produits: number;
  montant: string;
  date: string;
  statut: 'En cours' | 'Expédiée' | 'Livrée';
}

interface CommandesTableProps {
  commandes: Commande[];
}

interface StatusBadgeProps {
  status: 'En cours' | 'Expédiée' | 'Livrée';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'En cours': 'bg-orange-100 text-orange-800',
    'Expédiée': 'bg-blue-100 text-blue-800',
    'Livrée': 'bg-green-100 text-green-800'
  };

  const icons = {
    'En cours': 'ri-time-line',
    'Expédiée': 'ri-truck-line',
    'Livrée': 'ri-check-line'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      <i className={`${icons[status]} w-3 h-3 flex items-center justify-center mr-1`}></i>
      {status}
    </span>
  );
}

export default function CommandesTable({ commandes }: CommandesTableProps) {
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
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'montant') {
      aValue = parseInt(a.montant.replace(/[^0-9]/g, ''));
      bValue = parseInt(b.montant.replace(/[^0-9]/g, ''));
    }

    if (sortField === 'date') {
      aValue = new Date(a.date.split('/').reverse().join('-')).getTime();
      bValue = new Date(b.date.split('/').reverse().join('-')).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleActionClick = (action: string, commandeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Action ${action} sur commande:`, commandeId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Toutes les commandes</h3>
          <span className="text-sm text-gray-500">128 commandes au total</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° COMMANDE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CLIENT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DATE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MONTANT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCommandes.map((commande) => (
              <tr key={commande.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-green-600">{commande.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{commande.client}</div>
                    <div className="text-sm text-gray-500">{commande.ville}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{commande.date}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">{commande.montant}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={commande.statut} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleActionClick('voir', commande.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 cursor-pointer"
                    >
                      <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
                    </button>
                    <button
                      onClick={(e) => handleActionClick('modifier', commande.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 cursor-pointer"
                    >
                      <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
                    </button>
                    <button
                      onClick={(e) => handleActionClick('supprimer', commande.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCommandes.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-file-list-3-line w-12 h-12 flex items-center justify-center text-gray-400 mx-auto mb-4"></i>
          <p className="text-gray-500">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
