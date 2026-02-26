'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDark: boolean;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, isDark }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Watchlist', path: '/watchlist', icon: '⭐' },
    { name: 'AI Chat', path: '/chat', icon: '🤖' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`border-r transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${isDark ? 'border-white/5 bg-[#0a0f16]' : 'border-gray-200 bg-white'}
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
      <div className="h-full flex flex-col">
        <div className={`flex items-center px-4 py-5 transition-all duration-200 ${sidebarOpen ? 'justify-between' : 'justify-start'}`}>
          <div className={`flex items-center gap-3 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500" />
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>SeunBot Pro</p>
              <p className="text-xs text-gray-500">Quant Terminal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}
          >
            {sidebarOpen ? '⟨' : '⟩'}
          </button>
        </div>

        <div className="px-3 py-2">
          <p className={`text-[11px] uppercase tracking-widest text-gray-500 ${sidebarOpen ? 'visible' : 'invisible'}`}>
            Menu
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.path === pathname 
                  ? isDark ? 'bg-[#131a24] text-white' : 'bg-slate-200 text-slate-900' 
                  : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
    </>
  );
}
