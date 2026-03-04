import { NavLink } from 'react-router';
import { LayoutDashboard, Shield, Users, ScrollText, Upload, Search, ChevronRight } from 'lucide-react';
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
      { path: '/admin/roles',  label: 'Rôles',              icon: Shield,      minLevel: 50 },
      { path: '/admin/users',  label: 'Utilisateurs',       icon: Users,       minLevel: 50 },
      { path: '/admin/audit',  label: "Journal d'audit",    icon: ScrollText,  minLevel: 50 },
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

export function Sidebar() {
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

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border">

      {/* ── Logo ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-3.5 w-3.5 text-sidebar-primary" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-wide text-sidebar-foreground">CNSS-SIRAP</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-sidebar-muted">Plateforme admin</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
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
                          'group flex items-center justify-between gap-2 rounded-md px-3 py-[7px] text-[13px] transition-all duration-100',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-2.5">
                            <Icon className={cn('h-[15px] w-[15px] shrink-0', isActive ? 'text-sidebar-primary' : 'opacity-50')} />
                            {label}
                          </span>
                          {isActive && <ChevronRight className="h-3 w-3 text-sidebar-muted" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── User card ── */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-accent-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-sidebar-foreground">{displayName}</p>
            <RoleBadge level={userLevel} />
          </div>
        </div>
      </div>
    </aside>
  );
}
