import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Link, Navigate } from 'react-router';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function onSubmit(data: FormValues) {
    try {
      await login(data.email, data.password);
    } catch {
      setError('root', { message: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.' });
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between bg-[hsl(224,71%,7%)] px-10 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30">
            <Shield className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white/90 tracking-wide">CNSS-SIRAP</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">Plateforme admin</p>
          </div>
        </div>

        {/* Central message */}
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Bienvenue sur<br />
              la plateforme<br />
              <span className="text-blue-400">SIRAP</span>
            </h2>
            <p className="text-[14px] text-white/40 leading-relaxed max-w-[280px]">
              Système Intégré de Recouvrement et d'Administration des Prestations.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              'Gestion des rôles et permissions',
              'Import et analyse des données Excel',
              'Exports PDF et Excel automatisés',
            ].map(f => (
              <li key={f} className="flex items-center gap-2.5 text-[13px] text-white/50">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/20">
          © {new Date().getFullYear()} CNSS Djibouti
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-[360px] space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-[15px] font-semibold">CNSS-SIRAP</span>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
            <p className="text-[14px] text-muted-foreground">
              Accédez à votre espace d'administration
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cnss.dj"
                autoComplete="email"
                autoFocus
                className={cn(errors.email && 'border-destructive focus-visible:ring-destructive/30')}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[12px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Mot de passe
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-primary hover:underline underline-offset-2"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn('pr-10', errors.password && 'border-destructive focus-visible:ring-destructive/30')}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword
                    ? <EyeOff className="h-[15px] w-[15px]" />
                    : <Eye className="h-[15px] w-[15px]" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Root error */}
            {errors.root && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-3.5 py-3">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                </span>
                <p className="text-[13px] text-destructive">{errors.root.message}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full gap-2 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
