import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sirap_sidebar_collapsed') === 'true';
  });

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sirap_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-6xl px-6 py-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
