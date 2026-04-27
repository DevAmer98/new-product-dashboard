"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  RefreshCcw,
  Search,
  Users,
  Phone,
  MapPin,
  User,
  Building2,
  CalendarDays,
  Tag,
  X,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

type FilterType = "all" | "my";

type Client = {
  id: number | string;
  company_name?: string;
  client_name?: string;
  phone_number?: string;
  city?: string;
  region?: string;
  street?: string;
  client_type?: string;
  username?: string;
  medad_status?: string;
  created_at?: string;
  tax_number?: string | null;
  [key: string]: unknown;
};

const PAGE_SIZE = 10;
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://app.newproducts.trade/api";

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "جميع العملاء", value: "all" },
  { label: "عملائي", value: "my" },
];

const CLIENT_TYPE_COLORS: Record<string, string> = {
  "Postponed client": "bg-amber-50 text-amber-700 border-amber-200",
  "One-time cash client": "bg-sky-50 text-sky-700 border-sky-200",
  "Regular client": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");

  const [usernameRaw, setUsernameRaw] = useState("");
  const [username, setUsername] = useState("");

  const [reloadToken, setReloadToken] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Restore username from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("clientsUsername") ?? "";
    setUsernameRaw(stored);
    setUsername(stored);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchRaw.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchRaw]);

  // Debounce username → auto-switch to "My Clients" + persist
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = usernameRaw.trim();
      setUsername(trimmed);
      setPage(1);
      if (trimmed) setFilterType("my");
      if (typeof window !== "undefined") {
        if (trimmed) {
          localStorage.setItem("clientsUsername", trimmed);
        } else {
          localStorage.removeItem("clientsUsername");
        }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [usernameRaw]);

  // Reset page when filter tab changes
  useEffect(() => {
    setPage(1);
  }, [filterType]);

  // Main fetch
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      if (filterType === "my" && !username) {
        setClients([]);
        setTotalPages(1);
        setTotal(0);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          query: search,
        });
        if (filterType === "my" && username) {
          params.append("username", username);
        }

        const res = await fetch(`${API_BASE}/allClients?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        setClients(Array.isArray(data.clients) ? data.clients : []);
        setTotalPages(Math.max(1, Number(data.totalPages) || 1));
        setTotal(Number(data.total) || 0);
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        setError("Unable to load clients. Please try again.");
        setClients([]);
        setTotalPages(1);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, search, filterType, username, reloadToken]);

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000", query: search });
      if (filterType === "my" && username) params.append("username", username);

      const res = await fetch(`${API_BASE}/allClients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const rows: Client[] = Array.isArray(data.clients) ? data.clients : [];

      const sheetData = rows.map((c) => ({
        "Company Name": c.company_name ?? "",
        "Client Name": c.client_name ?? "",
        Phone: c.phone_number ?? "",
        City: c.city ?? "",
        Region: c.region ?? "",
        "Client Type": c.client_type ?? "",
        "Registered By": c.username ?? "",
        "Registration Date": c.created_at
          ? new Date(c.created_at as string).toLocaleDateString("en-GB")
          : "",
        "Medad Status": c.medad_status ?? "",
        ID: c.id,
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clients");

      const fileName =
        filterType === "my" && username
          ? `clients_${username.replace(/\s+/g, "_")}.xlsx`
          : "clients_all.xlsx";

      XLSX.writeFile(wb, fileName);
    } catch {
      // silent on error
    } finally {
      setDownloading(false);
    }
  };

  const missingUsername = filterType === "my" && !username;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-500">
                {total > 0 ? `${total.toLocaleString()} clients` : "Track registered clients"}
                {filterType === "my" && username ? ` · ${username}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadExcel}
              disabled={downloading || loading || clients.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className={`h-4 w-4 ${downloading ? "animate-bounce" : ""}`} />
              {downloading ? "Exporting…" : "Export Excel"}
            </button>
            <button
              onClick={() => setReloadToken((t) => t + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4">
        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Toggle */}
            <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1 text-sm text-slate-600">
              {FILTER_OPTIONS.map((opt) => {
                const active = filterType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className={`flex-1 rounded-full px-5 py-2 transition ${
                      active
                        ? "bg-white font-medium text-emerald-600 shadow-sm"
                        : "hover:text-emerald-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Name search */}
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder="Search by name, city…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              />
            </div>
          </div>

          {/* Username filter */}
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Sales username</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Type a username to filter clients by who registered them.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={usernameRaw}
                onChange={(e) => setUsernameRaw(e.target.value)}
                placeholder="e.g. هاني المصري"
                dir="auto"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
              />
              {usernameRaw && (
                <button
                  type="button"
                  onClick={() => setUsernameRaw("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Client grid */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {missingUsername ? (
            <EmptyState
              icon={<User className="h-10 w-10 text-emerald-400" />}
              title="Username required"
              description="Type your sales username above to view your clients."
            />
          ) : loading ? (
            <LoadingState />
          ) : error ? (
            <EmptyState
              icon={<AlertCircle className="h-10 w-10 text-rose-500" />}
              title="Something went wrong"
              description={error}
              action={
                <button
                  onClick={() => setReloadToken((t) => t + 1)}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-600"
                >
                  Try again
                </button>
              }
            />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10 text-slate-300" />}
              title="No clients found"
              description="Try adjusting your search or username."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {!missingUsername && !loading && !error && clients.length > 0 && (
          <footer className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">
            <p className="text-sm text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">{page}</span> of{" "}
              <span className="font-semibold text-slate-700">{totalPages}</span>
              {total > 0 && (
                <span className="ml-2 text-slate-400">({total.toLocaleString()} total)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!canGoNext}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

/* ─── Client Card ─────────────────────────────────────────────────────────── */

function ClientCard({ client }: { client: Client }) {
  const formattedDate = useMemo(() => {
    const raw = client.created_at as string | undefined;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  }, [client.created_at]);

  const typeClass =
    CLIENT_TYPE_COLORS[client.client_type as string] ??
    "bg-slate-50 text-slate-600 border-slate-200";

  const location = [client.city, client.region].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold leading-snug text-slate-900">
              {client.company_name ?? "—"}
            </h2>
            {client.client_name && (
              <p className="truncate text-sm text-slate-500">{client.client_name}</p>
            )}
          </div>
        </div>
        {client.client_type && (
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeClass}`}>
            {client.client_type}
          </span>
        )}
      </div>

      <div className="mx-5 h-px bg-slate-100" />

      <div className="grid grid-cols-2 gap-3 p-5 pt-4 text-sm">
        {client.phone_number && (
          <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={client.phone_number as string} />
        )}
        {location && (
          <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={location} />
        )}
        {client.username && (
          <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Registered by" value={client.username as string} highlight />
        )}
        {formattedDate && (
          <DetailRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Registered" value={formattedDate} />
        )}
        {client.medad_status && (
          <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Status" value={client.medad_status as string} />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs text-slate-400">
        <span>ID #{client.id}</span>
        {client.city && <span>{client.city}</span>}
      </div>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className={`mt-0.5 shrink-0 ${highlight ? "text-emerald-500" : "text-slate-400"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate font-medium ${highlight ? "text-emerald-700" : "text-slate-700"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Utility ─────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-100 bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
      {icon}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="max-w-xs text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}
