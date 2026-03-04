import { NavLink } from 'react-router';
import {
  LayoutDashboard, Shield, Users, ScrollText,
  Upload, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, minLevel: 10 },
      { path: '/upload',    label: 'Import Excel',    icon: Upload,          minLevel: 10 },
      { path: '/analysis',  label: 'Analyse',         icon: Search,          minLevel: 10 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/roles',  label: 'Rôles',            icon: Shield,     minLevel: 50 },
      { path: '/admin/users',  label: 'Utilisateurs',     icon: Users,      minLevel: 50 },
      { path: '/admin/audit',  label: "Journal d'audit",  icon: ScrollText, minLevel: 50 },
    ],
  },
];

function RoleBadge({ level }: { level: number }) {
  const cls =
    level >= 100
      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
      : level >= 50
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  return (
    <span className={cn('inline-flex h-4 items-center rounded px-1 text-[9px] font-semibold uppercase tracking-wider', cls)}>
      {level >= 100 ? 'Owner' : level >= 50 ? 'Admin' : 'Agent'}
    </span>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const userLevel = user?.role.level ?? 0;
  const displayName = user?.profile?.fullName?.trim() || user?.email || 'Utilisateur';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase() || '?';

  // All visible items flattened (used in collapsed mode)
  const allVisible = NAV_GROUPS.flatMap(g => g.items).filter(i => userLevel >= i.minLevel);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out',
        collapsed ? 'w-[56px]' : 'w-[220px]',
      )}
    >
      {/* ── Header ── */}
      <div className={cn(
        'flex h-14 shrink-0 items-center border-b border-sidebar-border',
        collapsed ? 'justify-center px-0' : 'justify-between px-4',
      )}>
        {collapsed ? (
          /* Collapsed : icône cliquable pour ouvrir */
          <button
            onClick={onToggle}
            title="Ouvrir le menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Shield className="h-4 w-4 text-primary" />
          </button>
        ) : (
          /* Expanded */
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[13px] font-semibold tracking-wide text-sidebar-foreground">CNSS-SIRAP</span>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-sidebar-muted">Plateforme admin</span>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Réduire le menu"
              className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {collapsed ? (
          /* ── Mode réduit : icônes seules centrées ── */
          <ul className="flex flex-col items-center gap-0.5 px-1.5">
            {allVisible.map(({ path, label, icon: Icon }) => (
              <li key={path} className="w-full">
                <NavLink
                  to={path}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 w-full items-center justify-center rounded-md transition-all duration-100',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <Icon className={cn('h-[17px] w-[17px]', isActive ? 'text-primary-foreground' : '')} />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          /* ── Mode étendu : groupes avec labels ── */
          <div className="space-y-4 px-2">
            {NAV_GROUPS.map(group => {
              const visible = group.items.filter(i => userLevel >= i.minLevel);
              if (visible.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {visible.map(({ path, label, icon: Icon }) => (
                      <li key={path}>
                        <NavLink
                          to={path}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center justify-between gap-2 rounded-md px-3 py-[7px] text-[13px] transition-all duration-100',
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className="flex items-center gap-2.5">
                                <Icon className={cn('h-[15px] w-[15px] shrink-0', isActive ? 'text-primary-foreground' : 'opacity-60')} />
                                {label}
                              </span>
                              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── User card ── */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        {collapsed ? (
          <div className="flex h-9 w-full items-center justify-center rounded-md bg-sidebar-accent">
            <span className="text-[11px] font-semibold text-sidebar-accent-foreground">{initials}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-accent-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-sidebar-foreground">{displayName}</p>
              <RoleBadge level={userLevel} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
