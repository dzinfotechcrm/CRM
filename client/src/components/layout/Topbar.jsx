import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
      {/* Left — Hamburger + context */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right — user info + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-slate-300">
            {user?.display_name || user?.username || 'User'}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400
                     hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="text-sm hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
