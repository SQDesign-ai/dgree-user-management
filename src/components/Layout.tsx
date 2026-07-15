import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Ship,
  Navigation,
  MonitorSmartphone,
  History,
  LayoutGrid,
  BellRing,
  ClipboardList,
  Droplet,
  Bell,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  to?: string;
}

const primaryNav: NavItem[] = [
  { label: "Fleet", icon: <LineChart className="size-[18px]" /> },
  { label: "Yacht overview", icon: <Ship className="size-[18px]" /> },
  { label: "Yacht track", icon: <Navigation className="size-[18px]" /> },
  { label: "Virtual cockpit", icon: <MonitorSmartphone className="size-[18px]" /> },
  { label: "Historical data", icon: <History className="size-[18px]" /> },
  { label: "Dashboard", icon: <LayoutGrid className="size-[18px]" /> },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
        <Ship className="size-5 text-white" />
      </div>
      <div className="leading-none">
        <div className="text-lg font-bold tracking-tight text-white">
          D.gree
        </div>
        <div className="mt-1 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
          YACHTING
        </div>
      </div>
    </div>
  );
}

function NavRow({ item }: { item: NavItem }) {
  // No selected/hover states — the sidebar is static chrome here; only the
  // user-avatar menu at the bottom carries a selected treatment.
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-3">
      <span className="text-ink-3">{item.icon}</span>
      {item.label}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-nav-section">
      {children}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-[236px] shrink-0 flex-col gap-1 rounded-xl bg-nav p-4">
      <div className="pb-4 pt-1">
        <Logo />
      </div>

      <Link
        to="/"
        className="mb-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
      >
        <span className="flex items-center gap-2.5">
          <Ship className="size-[18px]" />
          Yacht name
        </span>
        <ChevronRight className="size-4 text-ink-4" />
      </Link>

      <nav className="flex flex-1 flex-col">
        {primaryNav.map((n) => (
          <NavRow key={n.label} item={n} />
        ))}

        <SectionLabel>Alarm manager</SectionLabel>
        <NavRow item={{ label: "Alarms", icon: <BellRing className="size-[18px]" /> }} />

        <SectionLabel>Maintenance</SectionLabel>
        <NavRow
          item={{ label: "Automated plan", icon: <ClipboardList className="size-[18px]" /> }}
        />
        <NavRow item={{ label: "Oil analysis", icon: <Droplet className="size-[18px]" /> }} />
      </nav>

      <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-3">
        <span className="relative">
          <Bell className="size-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </span>
        Notifications
      </div>

      <UserMenu />
    </aside>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const item =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-white/[0.06] hover:text-white";
  return (
    <div className="relative mt-1">
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-1.5 shadow-2xl">
            <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-nav-section">
              Pages
            </div>
            <Link to="/" onClick={close} className={item}>
              <ShieldCheck className="size-[18px]" />
              Access management
            </Link>
            <Link to="/fleet" onClick={close} className={item}>
              <Ship className="size-[18px]" />
              D.gree fleet
            </Link>
          </div>
        </>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5 text-left ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
            <SlidersHorizontal className="size-4 text-ink-2" />
          </span>
          <span className="text-sm font-semibold text-white">Menu</span>
        </span>
        <ChevronRight
          className={`size-4 text-ink-4 transition-transform ${
            open ? "-rotate-90" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full bg-page p-4">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-5">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
