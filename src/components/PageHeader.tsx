import { type ReactNode, Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-2">
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3 text-muted" />}
          {c.to ? (
            <Link to={c.to} className="transition-colors hover:text-ink-3">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink-4">{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({
  crumbs,
  title,
  badge,
  subtitle,
  actions,
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumbs items={crumbs} />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-ink-4">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
