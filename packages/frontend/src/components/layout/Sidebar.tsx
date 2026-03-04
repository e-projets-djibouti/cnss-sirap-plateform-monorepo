import { NavLink } from 'react-router';
import { LayoutDashboard, Shield, Users, ScrollText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, minLevel: 10 },
  { path: '/upload', label: 'Import Excel', icon: Upload, minLevel: 10 },
  { path: '/admin/roles', label: 'Rôles', icon: Shield, minLevel: 50 },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users, minLevel: 50 },
  { path: '/admin/audit', label: 'Audit', icon: ScrollText, minLevel: 50 },
];

export function Sidebar() {
  const { user } = useAuth();
  const level = user?.role.level ?? 0;
  const visibleItems = NAV_ITEMS.filter(item => level >= item.minLevel);
  const displayName = user?.profile?.fullName?.trim() || user?.email || 'Utilisateur';

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-semibold tracking-tight">CNSS-SIRAP</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-3">
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-xs font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user?.role.name}</p>
        </div>
      </div>
    </aside>
  );
}
