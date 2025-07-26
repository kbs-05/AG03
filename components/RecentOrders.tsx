
'use client';

interface Order {
  id: string;
  client: string;
  montant: string;
  statut: 'Livré' | 'En cours' | 'Expédié';
}

interface StatusBadgeProps {
  status: 'Livré' | 'En cours' | 'Expédié';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    'Livré': 'bg-green-100 text-green-800',
    'En cours': 'bg-yellow-100 text-yellow-800',
    'Expédié': 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function RecentOrders() {
  const orders: Order[] = [
    { id: '#AG-0125', client: 'Jean Ndong', montant: '25,000 XAF', statut: 'Livré' },
    { id: '#AG-0124', client: 'Marie Mba', montant: '18,500 XAF', statut: 'En cours' },
    { id: '#AG-0123', client: 'Paul Ondo', montant: '32,000 XAF', statut: 'Expédié' },
    { id: '#AG-0122', client: 'Sophie Obiang', montant: '15,750 XAF', statut: 'Livré' },
    { id: '#AG-0121', client: 'Pierre Mengue', montant: '28,200 XAF', statut: 'En cours' },
    { id: '#AG-0120', client: 'Fatou Diallo', montant: '19,800 XAF', statut: 'Expédié' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Commandes Récentes</h3>
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
                MONTANT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{order.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{order.client}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{order.montant}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.statut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
