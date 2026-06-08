import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-dark">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
