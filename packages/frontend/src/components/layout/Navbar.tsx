import { Moon, Sun, LogOut, User, KeyRound, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Tableau de bord',
  '/upload':       'Import Excel',
  '/analysis':     'Analyse',
  '/admin/roles':  'Gestion des rôles',
  '/admin/users':  'Utilisateurs',
  '/admin/audit':  "Journal d'audit",
  '/profile':      'Mon profil',
};

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] ?? 'CNSS-SIRAP';
  const fullName = user?.profile?.fullName?.trim() || '';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      {/* Page title */}
      <span className="text-[15px] font-semibold text-foreground">{title}</span>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/70" disabled>
          <Bell className="h-[15px] w-[15px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/70 hover:text-foreground"
          onClick={toggleTheme}
          aria-label="Basculer le thème"
        >
          {theme === 'dark'
            ? <Sun className="h-[15px] w-[15px]" />
            : <Moon className="h-[15px] w-[15px]" />
          }
        </Button>

        <div className="mx-2 h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 pl-1.5 pr-2.5 text-sm font-normal hover:bg-accent">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.profile?.avatarUrl ?? undefined} alt={fullName || 'User'} />
                <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[140px] truncate font-medium sm:block">
                {fullName || user?.email || 'Utilisateur'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={6}>
            <DropdownMenuLabel className="py-2 font-normal">
              <p className="text-sm font-semibold">{fullName || 'Utilisateur'}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/change-password')}>
              <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
              Changer le mot de passe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
