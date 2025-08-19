'use client';

import { Client } from '@/lib/clients';
import Image from 'next/image';

interface ClientsTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export default function ClientsTable({ clients, onSelectClient }: ClientsTableProps) {
  return (
    <div className="flex flex-col bg-white shadow-lg rounded-xl border border-gray-100 max-h-[80vh]">
      {/* Table scrollable */}
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* En-tête */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Téléphone</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            </tr>
          </thead>

          {/* Corps du tableau */}
          <tbody className="bg-white divide-y divide-gray-100">
            {clients.map((client, index) => (
              <tr
                key={client.id ?? index}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSelectClient(client)}
              >
                {/* Photo */}
                <td className="px-4 py-2 whitespace-nowrap">
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
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {client.displayName ?? 'Nom non défini'}
                </td>

                {/* Email */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {client.email ?? '—'}
                </td>

                {/* Téléphone */}
                <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 flex items-center">
                  <i className="ri-phone-line mr-2 text-green-600"></i>
                  {client.phoneNumber ?? '—'}
                </td>

                {/* Date */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
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

        {/* Message si aucun client */}
        {clients.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            Aucun client trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
