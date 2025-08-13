'use client';

import { Client } from '@/lib/clients';

interface ClientsTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export default function ClientsTable({ clients, onSelectClient }: ClientsTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client, index) => (
            <tr
              key={client.id ?? index}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onSelectClient(client)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {client.displayName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.phoneNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {clients.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          Aucun client trouvé.
        </div>
      )}
    </div>
  );
}
