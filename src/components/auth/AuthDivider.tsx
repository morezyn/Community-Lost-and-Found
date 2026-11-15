export function AuthDivider() {
  return (
    <div className="relative flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        or use email
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
