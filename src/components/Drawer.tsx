import { type ReactNode, useEffect, useId } from "react";
import { X, Check } from "lucide-react";
import { Avatar, Badge } from "./ui";

// ---- Right-side drawer shell --------------------------------------------

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  submitDisabled = false,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  /** Replaces the default Cancel/Submit footer (e.g. for a multi-step wizard). */
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm [animation:overlay-in_150ms_ease-out]"
        onClick={onClose}
      />
      <aside
        // min-width beats max-width in CSS, so the floor only applies once
        // there is room for it — below that the drawer takes the full screen.
        className="relative z-10 flex h-full w-full flex-col border-l border-line bg-surface-2 shadow-2xl [animation:drawer-in_220ms_cubic-bezier(0.22,1,0.36,1)] sm:w-[50vw] sm:min-w-[520px] sm:max-w-full"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-ink-4">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-ink-2"
          >
            <X className="size-5" />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitDisabled) onSubmit();
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {children}
          </div>
          {footer ?? (
            <footer className="flex justify-end gap-2 border-t border-line bg-surface/40 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-3 transition-colors hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitDisabled}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitLabel}
              </button>
            </footer>
          )}
        </form>
      </aside>
    </div>
  );
}

// ---- form fields ---------------------------------------------------------

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold text-ink-3"
    >
      {children}
    </label>
  );
}

const control =
  "w-full rounded-lg border border-line bg-[#0e2149] px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

export function Row({ children }: { children: ReactNode }) {
  // Paired fields sit side by side only when that leaves each one usable.
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={control}
      />
    </div>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${control} resize-none`}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${control} ${value ? "text-ink" : "text-muted"}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${control} [color-scheme:dark]`}
      />
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[#2f6bed]"
      />
      <span>{label}</span>
    </label>
  );
}

/** Read-only field with an AUTO badge — e.g. an auto-generated UUID. */
export function AutoField({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-ink-3">{label}</div>
      <div className="flex items-center justify-between rounded-lg border border-line bg-[#0e2149]/60 px-3 py-2.5 text-sm text-muted">
        <span>{text}</span>
        <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#9dc0ff]">
          AUTO
        </span>
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}

// ---- multi-select checklist ---------------------------------------------

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string; // e.g. "SailADV"
}

/**
 * Scrollable checkbox list for picking many items (brands, people…). Selection
 * is controlled via `selected` (array of values) + `onToggle`.
 */
export function MultiSelectField({
  label,
  options,
  selected,
  onToggle,
  avatar = false,
  emptyText = "Nothing available.",
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  avatar?: boolean;
  emptyText?: string;
}) {
  const chosen = new Set(selected);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-3">{label}</span>
        {selected.length > 0 && (
          <span className="text-xs text-brand">{selected.length} selected</span>
        )}
      </div>
      {options.length === 0 ? (
        <div className="rounded-lg border border-line bg-[#0e2149]/60 px-3 py-3 text-xs text-muted">
          {emptyText}
        </div>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-[#0e2149]/40 p-1.5">
          {options.map((o) => {
            const on = chosen.has(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onToggle(o.value)}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                  on ? "bg-brand/15" : "hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                    on
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-transparent"
                  }`}
                >
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
                {avatar && <Avatar name={o.label} size={26} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">
                    {o.label}
                  </span>
                  {o.sublabel && (
                    <span className="block truncate text-xs text-muted">
                      {o.sublabel}
                    </span>
                  )}
                </span>
                {o.badge && <Badge tone="brand">{o.badge}</Badge>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Read-only context chip used where the Figma "Assign to" is fixed. */
export function AssignField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-ink-3">{label}</div>
      <div className="rounded-lg border border-line bg-[#0e2149]/60 px-3 py-2.5 text-sm text-ink-2">
        {value}
      </div>
    </div>
  );
}
