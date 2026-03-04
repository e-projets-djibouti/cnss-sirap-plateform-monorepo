export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-card/60 px-6 py-2.5">
      <p className="text-center text-[11px] text-muted-foreground/60">
        © {new Date().getFullYear()} CNSS · Plateforme d'administration SIRAP
      </p>
    </footer>
  );
}
