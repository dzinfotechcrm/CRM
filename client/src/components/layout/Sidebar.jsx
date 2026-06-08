import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  FolderKanban,
  RefreshCw,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/finance', label: 'Finance', icon: TrendingUp },
  { to: '/dues', label: 'Pending Dues', icon: AlertCircle },
  { to: '/goals', label: 'Goals', icon: Target },
];

export default function Sidebar({ collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          border-r border-slate-800/80 transition-transform duration-300 ease-in-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          w-64
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
              <span className="text-white font-bold text-sm">DZ</span>
            </div>
            {(!collapsed || mobileMenuOpen) && (
              <div className="animate-fade-in overflow-hidden">
                <h1 className="text-base font-bold text-white leading-tight whitespace-nowrap">DZ Infotech</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">Internal CRM</p>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 relative
                  ${isActive
                    ? 'bg-accent/10 text-accent-light'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }
                `}
                title={collapsed && !mobileMenuOpen ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />
                )}

                <Icon
                  size={20}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-accent-light' : 'text-slate-500 group-hover:text-slate-300'}`}
                />

                {(!collapsed || mobileMenuOpen) && (
                  <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-slate-800/60
                     text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
