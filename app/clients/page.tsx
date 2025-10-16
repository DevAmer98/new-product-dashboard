"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, RefreshCcw, Search, Users } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";

type FilterType = "all" | "my";

type Client = {
  id: string;
  name: string;
  city?: string;
  area?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  createdBy?: string;
  assignedTo?: string;
  status?: string;
  [key: string]: unknown;
};

const PAGE_SIZE = 10;
const API_BASE = "https://newproduct.newproducts.trade/api";
const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "جميع العملاء", value: "all" },
  { label: "عملائي", value: "my" },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // hydrate username from storage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("clientsUsername") ?? "";
    setUsername(stored);
    setUsernameInput(stored);
  }, []);

  // debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // reset pagination when toggling filter
  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const saveUsername = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setUsername(trimmed);
      if (typeof window !== "undefined") {
        if (trimmed) {
          window.localStorage.setItem("clientsUsername", trimmed);
        } else {
          window.localStorage.removeItem("clientsUsername");
        }
      }
      setReloadToken((token) => token + 1);
    },
    []
  );

  // fetch when dependencies change
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      if (filterType === "my" && !username) {
        setClients([]);
        setTotalPages(1);
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
          search: searchQuery,
        });
        const endpoint = filterType === "my" ? "/myClients" : "/allClients";
        if (filterType === "my") {
          params.append("username", username);
        }

        const response = await fetch(`${API_BASE}${endpoint}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (cancelled) return;

        setClients(Array.isArray(data.clients) ? data.clients : []);
        setTotalPages(Math.max(1, Number(data.totalPages) || 1));
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        setError("Unable to load clients right now. Please try again.");
        setClients([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, searchQuery, filterType, username, reloadToken]);

  const handleRefresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const missingUsername = filterType === "my" && !username;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;


       


  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-500">Track registered clients, search, and filter by assignment.</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SegmentedToggle
              value={filterType}
              options={FILTER_OPTIONS}
              onChange={(value) => setFilterType(value)}
            />

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search clients by name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              />
            </div>
          </div>

          <UsernameForm
            filterType={filterType}
            usernameInput={usernameInput}
            onInputChange={setUsernameInput}
            onSave={saveUsername}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {missingUsername ? (
            <EmptyState
              icon={<AlertCircle className="h-10 w-10 text-emerald-500" />}
              title="Username required"
              description="Set your username above to view clients assigned to you."
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
                  onClick={handleRefresh}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-600"
                >
                  Try again
                </button>
              }
            />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10 text-slate-400" />}
              title="No clients found"
              description="Adjust your search or filters to see more results."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {clients.map((client) => (
                <ClientCard key={client.id ?? client.name} client={client} />
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">
          <div className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!canGoPrev}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: FilterType }[];
  value: FilterType;
  onChange: (value: FilterType) => void;
}) {
  return (
    <div className="flex w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1 text-sm text-slate-600 md:w-auto">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              active ? "bg-white text-emerald-600 shadow-sm" : "hover:text-emerald-600"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function UsernameForm({
  filterType,
  usernameInput,
  onInputChange,
  onSave,
}: {
  filterType: FilterType;
  usernameInput: string;
  onInputChange: (value: string) => void;
  onSave: (value: string) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(usernameInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700">Sales username</span>
        <span className="text-xs text-slate-500">
          Required to load results when viewing{" "}
          <span className="font-semibold text-emerald-600">My Clients</span>.
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={usernameInput}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Enter username"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 sm:w-60"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              onInputChange("");
              onSave("");
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:text-rose-500"
            disabled={!usernameInput && filterType !== "my"}
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}

function ClientCard({ client }: { client: Client }) {
  const formattedDate = useMemo(() => {
    if (!client.createdAt) return null;
    const date = new Date(client.createdAt);
    return Number.isNaN(date.getTime())
      ? client.createdAt
      : date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  }, [client.createdAt]);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{client.name}</h2>
          {(client.city || client.area) && (
            <p className="text-sm text-slate-500">
              {[client.city, client.area].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
        {client.status && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            {String(client.status)}
          </span>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
        {client.createdBy && (
          <InfoRow label="Created by" value={client.createdBy} />
        )}
        {client.assignedTo && (
          <InfoRow label="Assigned to" value={client.assignedTo} />
        )}
        {client.phone && (
          <InfoRow label="Phone" value={client.phone} />
        )}
        {client.email && (
          <InfoRow label="Email" value={client.email} />
        )}
        {formattedDate && (
          <InfoRow label="Created at" value={formattedDate} />
        )}
        {client.id && (
          <InfoRow label="Client ID" value={String(client.id)} />
        )}
      </dl>

      <footer className="flex items-center justify-between text-xs text-slate-400">
        <span>Last synced just now</span>
        <span>API source • newproducts.trade</span>
      </footer>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
        />
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      {icon}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}
