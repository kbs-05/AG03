'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  type: 'particulier' | 'entreprise';
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  status: 'actif' | 'inactif';
}

export default function ClientsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const clients: Client[] = [
    {
      id: '1',
      name: 'Jean Ndong',
      type: 'particulier',
      email: 'jean.ndong@example.com',
      phone: '+241 01 23 45 67',
      orders: 12,
      totalSpent: 125500,
      status: 'actif'
    },
    {
      id: '2',
      name: 'SuperMarché Gabon',
      type: 'entreprise',
      email: 'contact@supermarche-ga.com',
      phone: '+241 01 34 56 78',
      orders: 24,
      totalSpent: 325750,
      status: 'actif'
    },
    {
      id: '3',
      name: 'Marie Mba',
      type: 'particulier',
      email: 'marie.mba@example.com',
      phone: '+241 02 45 67 89',
      orders: 5,
      totalSpent: 45250,
      status: 'inactif'
    },
    {
      id: '4',
      name: 'Restaurant Le Bon Goût',
      type: 'entreprise',
      email: 'contact@bon-gout.ga',
      phone: '+241 03 56 78 90',
      orders: 18,
      totalSpent: 215000,
      status: 'actif'
    },
    {
      id: '5',
      name: 'Paul Obame',
      type: 'particulier',
      email: 'paul.obame@example.com',
      phone: '+241 04 67 89 01',
      orders: 8,
      totalSpent: 78900,
      status: 'actif'
    },
    {
      id: '6',
      name: 'Hôtel Libreville Palace',
      type: 'entreprise',
      email: 'contact@palace-lbv.ga',
      phone: '+241 05 78 90 12',
      orders: 15,
      totalSpent: 187500,
      status: 'inactif'
    },
    {
      id: '7',
      name: 'Claire Mboumba',
      type: 'particulier',
      email: 'claire.mboumba@example.com',
      phone: '+241 06 89 01 23',
      orders: 3,
      totalSpent: 32000,
      status: 'actif'
    },
    {
      id: '8',
      name: 'Café des Amis',
      type: 'entreprise',
      email: 'contact@cafe-amis.ga',
      phone: '+241 07 90 12 34',
      orders: 11,
      totalSpent: 98500,
      status: 'actif'
    },
    {
      id: '9',
      name: 'Thierry Oyono',
      type: 'particulier',
      email: 'thierry.oyono@example.com',
      phone: '+241 08 01 23 45',
      orders: 7,
      totalSpent: 65200,
      status: 'actif'
    },
    {
      id: '10',
      name: 'Marché Central',
      type: 'entreprise',
      email: 'contact@marche-central.ga',
      phone: '+241 09 12 34 56',
      orders: 28,
      totalSpent: 445000,
      status: 'actif'
    },
    {
      id: '11',
      name: 'Sylvie Ekomy',
      type: 'particulier',
      email: 'sylvie.ekomy@example.com',
      phone: '+241 10 23 45 67',
      orders: 6,
      totalSpent: 54300,
      status: 'inactif'
    },
    {
      id: '12',
      name: 'Épicerie du Quartier',
      type: 'entreprise',
      email: 'contact@epicerie-quartier.ga',
      phone: '+241 11 34 56 78',
      orders: 19,
      totalSpent: 267800,
      status: 'actif'
    }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'tous' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 flex items-center justify-center"></i>
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
            >
              <option value="tous">Tous les clients</option>
              <option value="particulier">Particuliers</option>
              <option value="entreprise">Entreprises</option>
            </select>
          </div>
          <button 
            onClick={() => router.push('/nouveau-client')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
            <span>Nouveau client</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commandes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dépenses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      client.type === 'particulier' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <i className={`${
                        client.type === 'particulier' ? 'ri-user-line text-blue-600' : 'ri-building-line text-purple-600'
                      } w-5 h-5 flex items-center justify-center`}></i>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{client.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.email}</div>
                  <div className="text-sm text-gray-500">{client.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{client.orders}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">{formatPrice(client.totalSpent)} XAF</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.status === 'actif'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.status === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center"></i>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 text-sm border rounded-md cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}