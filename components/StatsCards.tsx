
'use client';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  iconBg: string;
}

function StatCard({ title, value, change, changeType, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className={`flex items-center mt-2 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            <i className={`${changeType === 'positive' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} w-4 h-4 flex items-center justify-center mr-1`}></i>
            <span>{change}</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} text-white w-6 h-6 flex items-center justify-center`}></i>
        </div>
      </div>
    </div>
  );
}

export default function StatsCards() {
  const stats = [
    {
      title: 'Commandes',
      value: '128',
      change: '12% ce mois',
      changeType: 'positive' as const,
      icon: 'ri-shopping-cart-line',
      iconBg: 'bg-green-500'
    },
    {
      title: 'Revenus',
      value: '1.2M XAF',
      change: '8% ce mois',
      changeType: 'positive' as const,
      icon: 'ri-money-dollar-circle-line',
      iconBg: 'bg-blue-500'
    },
    {
      title: 'Produits',
      value: '86',
      change: '3% ce mois',
      changeType: 'negative' as const,
      icon: 'ri-product-hunt-line',
      iconBg: 'bg-orange-500'
    },
    {
      title: 'Clients',
      value: '254',
      change: '5% ce mois',
      changeType: 'positive' as const,
      icon: 'ri-team-line',
      iconBg: 'bg-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
