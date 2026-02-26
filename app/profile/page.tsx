'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  
  // Redirect to homepage - this page is disabled
  useEffect(() => {
    router.push('/');
  }, [router]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  // User info state
  const [name, setName] = useState('Alex Trader');
  const [email, setEmail] = useState('alex.trader@seunbot.pro');
  
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [signalAlerts, setSignalAlerts] = useState(true);
  
  // Trading preferences
  const [positionSize, setPositionSize] = useState('2');
  const [riskTolerance, setRiskTolerance] = useState('Moderate');
  const [maxDailyTrades, setMaxDailyTrades] = useState('5');
  const [tradingStyle, setTradingStyle] = useState('Swing Trading');

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to a backend
    alert('Settings saved successfully!');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'AI Chat', path: '/chat', icon: '🤖' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  const stats = [
    { label: 'Total Signals', value: '234', change: '+12%', positive: true },
    { label: 'Win Rate', value: '68%', change: '+5%', positive: true },
    { label: 'Active Trades', value: '8', change: '+2', positive: true },
    { label: 'Portfolio Value', value: '$45,230', change: '+15%', positive: true },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } ${isDark ? 'border-white/5 bg-[#0a0f16]' : 'border-gray-200 bg-white'}`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-5">
              <div className={`flex items-center gap-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500" />
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>SeunBot Pro</p>
                  <p className="text-xs text-gray-500">Quant Terminal</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}
              >
                {sidebarOpen ? '⟨' : '⟩'}
              </button>
            </div>

            <div className="px-3 py-2">
              <p className={`text-[11px] uppercase tracking-widest text-gray-500 ${sidebarOpen ? 'block' : 'hidden'}`}>
                Menu
              </p>
            </div>

            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    item.path === '/profile' 
                      ? isDark ? 'bg-[#131a24] text-white' : 'bg-slate-200 text-slate-900' 
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className={`px-4 py-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>AT</div>
                <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Alex Trader</p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile & Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`px-3 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-900 hover:text-gray-600'}`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className={`h-9 w-9 rounded-lg relative ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
                >
                  🔔
                  <span className="absolute top-1 right-1 h-2 w-2 bg-teal-500 rounded-full"></span>
                </button>
                {notificationOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-xl z-50 ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                    <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className={`p-4 border-b ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-gray-100'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>New BUY signal: BTC</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                      <div className={`p-4 border-b ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-gray-100'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>TSLA reached TP1</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                      <div className={`p-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Market analysis updated</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profile" className={`h-9 w-9 rounded-lg border flex items-center justify-center ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}>👤</Link>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl border p-5 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                    <span className={`text-xs font-medium ${stat.positive ? 'text-teal-400' : 'text-red-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Info Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-all ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900 hover:bg-gray-200'}`}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-3 py-2 mb-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                        placeholder="Full Name"
                      />
                    ) : (
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
                    )}
                    {isEditing ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                        placeholder="Email"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">{email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive alerts for new signals</p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        pushNotifications ? 'bg-teal-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Notifications</p>
                      <p className="text-sm text-gray-500">Daily summary reports</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        emailNotifications ? 'bg-teal-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Signal Alerts</p>
                      <p className="text-sm text-gray-500">Real-time trade notifications</p>
                    </div>
                    <button
                      onClick={() => setSignalAlerts(!signalAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        signalAlerts ? 'bg-teal-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          signalAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Trading Preferences */}
              <div className={`rounded-xl border p-6 lg:col-span-2 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trading Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Default Position Size (%)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={positionSize}
                        onChange={(e) => setPositionSize(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                      />
                    ) : (
                      <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{positionSize}%</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Risk Tolerance</label>
                    {isEditing ? (
                      <select
                        value={riskTolerance}
                        onChange={(e) => setRiskTolerance(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                      >
                        <option>Conservative</option>
                        <option>Moderate</option>
                        <option>Aggressive</option>
                      </select>
                    ) : (
                      <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{riskTolerance}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Max Daily Trades</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={maxDailyTrades}
                        onChange={(e) => setMaxDailyTrades(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                      />
                    ) : (
                      <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{maxDailyTrades}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Trading Style</label>
                    {isEditing ? (
                      <select
                        value={tradingStyle}
                        onChange={(e) => setTradingStyle(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                      >
                        <option>Day Trading</option>
                        <option>Swing Trading</option>
                        <option>Position Trading</option>
                        <option>Scalping</option>
                      </select>
                    ) : (
                      <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{tradingStyle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 transition-all shadow-lg shadow-teal-500/30"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-6 py-3 rounded-lg border transition-all ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
