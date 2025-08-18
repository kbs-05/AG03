'use client';

import { Client } from '@/lib/clients';
import Image from 'next/image';

interface ClientsTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export default function ClientsTable({ clients, onSelectClient }: ClientsTableProps) {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Photo
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Nom
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Téléphone
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date de création
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {clients.map((client, index) => (
            <tr
              key={client.id ?? index}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSelectClient(client)}
            >
              {/* Photo */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mx-auto">
                  {client.photoURL ? (
                    <Image
                      src={client.photoURL}
                      alt={client.displayName ?? 'Client'}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <i className="ri-user-line text-lg"></i>
                    </div>
                  )}
                </div>
              </td>

              {/* Nom */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {client.displayName ?? 'Nom non défini'}
              </td>

              {/* Email */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.email ?? '—'}
              </td>

              {/* Téléphone */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.phoneNumber ?? '—'}
              </td>

              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.date
                  ? new Date(client.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {clients.length === 0 && (
        <div className="p-6 text-center text-sm text-gray-500">
          Aucun client trouvé.
        </div>
      )}
    </div>
  );
}
