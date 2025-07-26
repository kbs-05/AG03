'use client';

export default function ClientsStats() {
  const stats = [
    {
      title: 'Clients actifs',
      value: '36',
      change: '+8% ce mois',
      changeType: 'positive',
      icon: 'ri-user-line',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Nouveaux clients',
      value: '5',
      change: '+12% ce mois',
      changeType: 'positive',
      icon: 'ri-user-add-line',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Clients inactifs',
      value: '6',
      change: '-3% ce mois',
      changeType: 'negative',
      icon: 'ri-user-unfollow-line',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
              <i className={`${stat.icon} ${stat.iconColor} w-6 h-6 flex items-center justify-center`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}