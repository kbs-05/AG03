'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';

type StatutCommande = 'En cours' | 'Expédiée' | 'Livrée';

interface CommandesHeaderProps {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  statusFilter: 'all' | StatutCommande;
  setStatusFilter: Dispatch<SetStateAction<'all' | StatutCommande>>;
}

export default function CommandesHeader({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: CommandesHeaderProps) {
  const router = useRouter();

  return (
    <>
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Gestion des Commandes</h2>

            {/* Champ recherche */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Recherche par ID ou client"
              className="border rounded px-3 py-1 text-sm"
            />

            {/* Select filtre statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StatutCommande)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Expédiée">Expédiée</option>
              <option value="Livrée">Livrée</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100" aria-label="Profil Admin">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-green-600"></i>
              </div>
              <span className="text-sm font-medium text-gray-900">Admin</span>
            </button>
          </div>
        </div>
      </header>

    </>
  );
}
