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
  Home,
  Menu,
} from "lucide-react";
import { Logo as DsLogo } from "@sqdesign-ai/dgree-ds-react";
import { Avatar } from "./ui";

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
    // The real wordmark from the DS — it paints with --brand-logo, which is
    // white in dark mode, so it needs no colour of its own here.
    <div className="px-2">
      <DsLogo className="h-7 w-auto" />
      <div className="mt-1.5 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
        YACHTING
      </div>
    </div>
  );
}

function NavRow({ item }: { item: NavItem }) {
  // Default → hover → selected, per the DS. Nothing here is marked selected:
  // these rows are inert chrome, so claiming one would imply a page you
  // aren't on. `active` is wired for when the nav becomes real.
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        item.active
          ? "bg-nav-selected text-white"
          : "text-ink-3 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span>{item.icon}</span>
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

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex w-[236px] shrink-0 flex-col gap-1 overflow-y-auto rounded-xl bg-nav p-4">
      <div className="pb-4 pt-1">
        <Logo />
      </div>

      <Link
        to="/access"
        onClick={onNavigate}
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

      <UserMenu onNavigate={onNavigate} />
    </aside>
  );
}

// No auth in this prototype — the signed-in user is a placeholder.
const CURRENT_USER = "User name";

function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  // Dismissing the popover only closes the popover; following a link out of it
  // also closes the mobile nav drawer behind it.
  const close = () => setOpen(false);
  const leave = () => {
    setOpen(false);
    onNavigate?.();
  };
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
            <Link to="/access" onClick={leave} className={item}>
              <ShieldCheck className="size-[18px]" />
              Access management
            </Link>
            <Link to="/fleet" onClick={leave} className={item}>
              <Ship className="size-[18px]" />
              D.gree fleet
            </Link>
            {/* The way back to the door between the two surfaces. Activation
                itself forks by role there, so there is nothing to link to
                directly from here. */}
            <div className="mt-1.5 border-t border-line pt-1.5">
              <Link to="/" onClick={leave} className={item}>
                <Home className="size-[18px]" />
                Prototype home
              </Link>
            </div>
          </div>
        </>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-nav-selected px-3 py-2.5 text-left transition-colors hover:brightness-110"
      >
        <span className="flex items-center gap-2.5">
          <Avatar name={CURRENT_USER} />
          <span className="text-sm font-semibold text-white">
            {CURRENT_USER}
          </span>
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
  // Below lg the sidebar would leave the content a column too narrow to read,
  // so it slides in over the page instead of sitting beside it.
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-full bg-page p-0 lg:p-4">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex p-3">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-hover/40"
          >
            <Menu className="size-[18px]" />
          </button>
          <DsLogo className="h-6 w-auto" />
        </div>
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
