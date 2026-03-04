export function Footer() {
  return (
    <footer className="border-t bg-background px-6 py-3">
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CNSS-SIRAP · Plateforme d'administration
      </p>
    </footer>
  );
}
