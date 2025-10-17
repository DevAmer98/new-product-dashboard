"use client";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Users,
  RefreshCw,
  Filter,
  Pencil,
  Trash2,
  X,
  Check,
  Settings,
  Home,
  ListChecks,
  UserPlus,
  Map as MapIcon,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* THEME (mint) */
const COLORS = {
  mint: "#BFF7D0",
  mintSoft: "#E8FDF0",
  mintBold: "#1B9D6D",
  ink: "#0F172A",
  subtle: "#64748B",
  border: "#D1FAE5",
};

type ApprovalRole = "Manager" | "Supervisor" | "Storekeeper" | "Driver";
const API_BASE = "https://newproduct.newproducts.trade/api";

type Quotation = {
  id: string;
  custom_id?: string;
  client_name?: string;
  client_company?: string;
  username?: string;
  manageraccept?: string | null;
  manageraccept_at?: string | null;
  supervisoraccept?: string | null;
  supervisoraccept_at?: string | null;
  status?: string | null;
  total_price?: number | string | null;
  total_after_discount?: number | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type Order = {
  id: string;
  custom_id?: string;
  client_name?: string;
  client_company?: string;
  status?: string | null;
  username?: string | null;
  driver_name?: string | null;
  total_price?: number | string | null;
  total_subtotal?: number | string | null;
  total_after_discount?: number | string | null;
  created_at?: string | null;
  delivery_date?: string | null;
  actual_delivery_date?: string | null;
  delivery_type?: string | null;
  manageraccept?: string | null;
  manageraccept_at?: string | null;
  supervisoraccept?: string | null;
  supervisoraccept_at?: string | null;
  storekeeperaccept?: string | null;
  storekeeperaccept_at?: string | null;
  [key: string]: unknown;
};

type Client = {
  id: string;
  name?: string;
  city?: string;
  area?: string;
  createdBy?: string;
  assignedTo?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  [key: string]: unknown;
};

type MapSale = {
  id: string;
  client: string;
  lat: number;
  lng: number;
  amount?: number | null;
};

type LateNotification = {
  id: string;
  title: string;
  reference: string;
  waitingOn: ApprovalRole;
  lateFor: string;
  requestedAtLabel: string;
  meta?: string;
};

type Driver = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
};

type MapCenter = {
  lat: number;
  lng: number;
};

type MapComponentProps = {
  drivers: Driver[];
  sales: MapSale[];
  center: MapCenter;
  color: string;
};

const LATE_THRESHOLD_HOURS = 12;
const LATE_THRESHOLD_MS = LATE_THRESHOLD_HOURS * 60 * 60 * 1000;

const ROLE_STYLES: Record<ApprovalRole, { badgeBg: string; badgeText: string }> = {
  Manager: { badgeBg: "bg-rose-50", badgeText: "text-rose-600" },
  Supervisor: { badgeBg: "bg-amber-50", badgeText: "text-amber-600" },
  Storekeeper: { badgeBg: "bg-indigo-50", badgeText: "text-indigo-600" },
  Driver: { badgeBg: "bg-sky-50", badgeText: "text-sky-600" },
};

const formatDuration = (ms: number) => {
  if (ms <= 0) return "0m";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
};

const formatTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const isAccepted = (value?: string | null) => value?.toLowerCase() === "accepted";
const isRejected = (value?: string | null) => {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "rejected") return true;
  return normalized.includes("reject");
};

const pickFirstNumber = (...values: Array<unknown>) => {
  for (const value of values) {
    const parsed = parseNumber(value);
    if (parsed != null) return parsed;
  }
  return null;
};

/* DEMO DATA (drivers/users placeholders) */
const seedDrivers: Driver[] = [
  { id: "D-101", name: "Omar", lat: 24.7136, lng: 46.6753, status: "DELIVERING" },
  { id: "D-212", name: "Huda", lat: 24.7803, lng: 46.7386, status: "IDLE" },
  { id: "D-304", name: "Khalid", lat: 24.6408, lng: 46.717, status: "PICKING" },
];
const seedUsers: User[] = [
  { id: "U1", name: "Mohammed Shaaban", email: "m.shaaban@example.com", phone: "+966500000000", role: "Sales", active: true },
  { id: "U2", name: "Noura Alanazi", email: "noura@example.com", phone: "+966511111111", role: "Driver", active: true },
  { id: "U3", name: "Fahad Al Harbi", email: "fahad@example.com", phone: "+966522222222", role: "Storekeeper", active: false },
];





/* MAP (SSR OFF) */
const MapView = dynamic(async () => {
  const L = await import("leaflet");
 type IconDefaultPrototype = typeof L.Icon.Default.prototype & { _getIconUrl?: () => void };
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  const { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } = await import("react-leaflet");

  function MapImpl(props: MapComponentProps) {
    const { drivers, sales, center, color } = props;
    return (
      <MapContainer center={[center.lat, center.lng]} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {drivers.map((driver: Driver) =>(
          <Marker key={driver.id} position={[driver.lat, driver.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{driver.name} ({driver.id})</div>
                <div className="text-sm text-slate-500">Status: {driver.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {sales.map((sale: MapSale) =>(
          <CircleMarker key={sale.id} center={[sale.lat, sale.lng]} radius={10} pathOptions={{ color }}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{sale.client}</div>
                <div className="text-sm text-slate-500">ID: {sale.id}</div>
                {typeof sale.amount === "number" && Number.isFinite(sale.amount) && (
                  <div className="text-sm">Amount: {sale.amount.toLocaleString()} SAR</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {drivers[0] && (
          <Polyline
            positions={[
              [drivers[0].lat + 0.02, drivers[0].lng - 0.02],
              [drivers[0].lat, drivers[0].lng],
            ]}
            pathOptions={{ color }}
          />
        )}
      </MapContainer>
    );
  }

  return { default: MapImpl };
}, { ssr: false });

/* PAGE */
export default function ManagerDashboard() {
  // state
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);
  const [sales, setSales] = useState<MapSale[]>([]);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // splash once per session (~1.3s)
  useEffect(() => {
    const seen = sessionStorage.getItem("seenSplash");
    if (seen) {
      setShowSplash(false);
      return;
    }
    const t = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("seenSplash", "1");
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  // demo movement
  useEffect(() => {
    const t = setInterval(() => {
      setDrivers(prev =>
        prev.map(d => ({
          ...d,
          lat: d.lat + (Math.random() - 0.5) * 0.002,
          lng: d.lng + (Math.random() - 0.5) * 0.002,
        })),
      );
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadOrders = async () => {
      try {
        const params = new URLSearchParams({
          limit: "50",
          page: "1",
          status: "all",
          query: "",
        });
        const response = await fetch(`${API_BASE}/orders?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);
        const data = await response.json();
        if (ignore) return;
        const list = Array.isArray(data.orders) ? data.orders : Array.isArray(data.data) ? data.data : [];
        setOrders(list as Order[]);
      } catch (error) {
        if (ignore || (error as Error).name === "AbortError") return;
        console.error("Failed to load orders", error);
      }
    };

    loadOrders();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadQuotations = async () => {
      try {
        const params = new URLSearchParams({
          limit: "50",
          page: "1",
          status: "all",
          query: "",
        });
        const response = await fetch(`${API_BASE}/quotations?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Failed to load quotations: ${response.status}`);
        const data = await response.json();
        if (ignore) return;
        const list = Array.isArray(data.quotations)
          ? data.quotations
          : Array.isArray(data.orders)
          ? data.orders
          : [];
        setQuotations(list as Quotation[]);
      } catch (error) {
        if (ignore || (error as Error).name === "AbortError") return;
        console.error("Failed to load quotations", error);
      }
    };

    loadQuotations();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadClients = async () => {
      try {
        const params = new URLSearchParams({
          limit: "50",
          page: "1",
          search: "",
        });
        const response = await fetch(`${API_BASE}/allClients?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Failed to load clients: ${response.status}`);
        const data = await response.json();
        if (ignore) return;
        const list = Array.isArray(data.clients) ? data.clients : [];
        setClients(list as Client[]);
      } catch (error) {
        if (ignore || (error as Error).name === "AbortError") return;
        console.error("Failed to load clients", error);
      }
    };

    loadClients();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!clients.length) {
      setSales([]);
      return;
    }
    const mapped = clients
      .map((client, index) => {
        const lat = parseNumber(client.lat ?? client.latitude);
        const lng = parseNumber(client.lng ?? client.longitude);
        if (lat == null || lng == null) return null;
        const record = client as Record<string, unknown>;
        const amount = pickFirstNumber(
          record.total_after_discount,
          record.total_subtotal,
          record.total_price,
          record.amount
        );
        return {
          id: String(client.id ?? client.name ?? index),
          client: client.name ?? `Client ${index + 1}`,
          lat,
          lng,
          amount,
        } satisfies MapSale;
      })
      .filter((entry): entry is MapSale => entry !== null);
    setSales(mapped);
  }, [clients]);

  const center = useMemo(() => ({ lat: 24.7136, lng: 46.6753 }), []);

  const lateOrders = useMemo<LateNotification[]>(() => {
    const now = Date.now();
    return orders.reduce<LateNotification[]>((acc, order) => {
      if (
        isRejected(order.status) ||
        isRejected(order.manageraccept) ||
        isRejected(order.supervisoraccept) ||
        isRejected(order.storekeeperaccept)
      ) {
        return acc;
      }

      const managerAccepted = isAccepted(order.manageraccept);
      const supervisorAccepted = isAccepted(order.supervisoraccept);
      const storekeeperAccepted = isAccepted(order.storekeeperaccept);

      if (managerAccepted && supervisorAccepted && storekeeperAccepted) return acc;

      let waitingOn: ApprovalRole = "Manager";
      if (!managerAccepted) {
        waitingOn = "Manager";
      } else if (!supervisorAccepted) {
        waitingOn = "Supervisor";
      } else {
        waitingOn = "Storekeeper";
      }

      const createdTimestamp = order.created_at;
      if (!createdTimestamp) return acc;
      const createdTs = Date.parse(createdTimestamp);
      if (Number.isNaN(createdTs)) return acc;
      const ageMs = now - createdTs;
      if (ageMs < LATE_THRESHOLD_MS) return acc;

      const total = pickFirstNumber(order.total_after_discount, order.total_subtotal, order.total_price);
      const metaParts = [
        order.status ? String(order.status) : null,
        total != null ? `${total.toLocaleString()} SAR` : null,
      ].filter(Boolean);

      acc.push({
        id: String(order.id),
        title: order.client_name ?? order.client_company ?? `Order ${order.custom_id ?? order.id}`,
        reference: `Order ${order.custom_id ?? order.id}`,
        waitingOn,
        lateFor: formatDuration(ageMs),
        requestedAtLabel: `Created ${formatTimeLabel(createdTimestamp)}`,
        meta: metaParts.length ? metaParts.join(" • ") : undefined,
      });
      return acc;
    }, []);
  }, [orders]);

  const lateQuotations = useMemo<LateNotification[]>(() => {
    const now = Date.now();
    return quotations.reduce<LateNotification[]>((acc, quotation) => {
      if (
        isRejected(quotation.status) ||
        isRejected(quotation.manageraccept) ||
        isRejected(quotation.supervisoraccept)
      ) {
        return acc;
      }

      const managerAccepted = isAccepted(quotation.manageraccept);
      const supervisorAccepted = isAccepted(quotation.supervisoraccept);

      if (managerAccepted && supervisorAccepted) return acc;

      let waitingOn: ApprovalRole = "Manager";
      if (!managerAccepted) {
        waitingOn = "Manager";
      } else {
        waitingOn = "Supervisor";
      }

      const createdTimestamp = quotation.created_at;
      if (!createdTimestamp) return acc;
      const createdTs = Date.parse(createdTimestamp);
      if (Number.isNaN(createdTs)) return acc;
      const ageMs = now - createdTs;
      if (ageMs < LATE_THRESHOLD_MS) return acc;

      const total = pickFirstNumber(quotation.total_after_discount, quotation.total_price);
      const metaParts = [
        quotation.username ? String(quotation.username) : null,
        total != null ? `${total.toLocaleString()} SAR` : null,
      ].filter(Boolean);

      acc.push({
        id: String(quotation.id),
        title:
          quotation.client_name ??
          quotation.client_company ??
          `Quotation ${quotation.custom_id ?? quotation.id}`,
        reference: `Quotation ${quotation.custom_id ?? quotation.id}`,
        waitingOn,
        lateFor: formatDuration(ageMs),
        requestedAtLabel: `Created ${formatTimeLabel(createdTimestamp)}`,
        meta: metaParts.length ? metaParts.join(" • ") : undefined,
      });
      return acc;
    }, []);
  }, [quotations]);

  const lateDeliveries = useMemo<LateNotification[]>(() => {
    const now = Date.now();
    return orders.reduce<LateNotification[]>((acc, order) => {
      if (isRejected(order.status)) return acc;
      const delivered =
        Boolean(order.actual_delivery_date) ||
        (order.status ? String(order.status).toLowerCase() === "delivered" : false);
      if (delivered) return acc;

      const baseTimestamp = order.delivery_date ?? order.created_at;
      if (!baseTimestamp) return acc;
      const baseTs = Date.parse(baseTimestamp);
      if (Number.isNaN(baseTs)) return acc;

      const ageMs = now - baseTs;
      if (ageMs < LATE_THRESHOLD_MS) return acc;

      const total = pickFirstNumber(order.total_after_discount, order.total_subtotal, order.total_price);
      const driverNameRaw =
        order.driver_name ??
        (order as Record<string, unknown>).driver ??
        (order as Record<string, unknown>).drivername;
      const driverName = typeof driverNameRaw === "string" && driverNameRaw.trim() ? driverNameRaw : null;
      const metaParts = [
        order.status ? String(order.status) : null,
        order.delivery_type ? String(order.delivery_type) : null,
        driverName ? `Driver: ${driverName}` : null,
        total != null ? `${total.toLocaleString()} SAR` : null,
      ].filter(Boolean);

      acc.push({
        id: `delivery-${order.id}`,
        title: order.client_name ?? order.client_company ?? `Order ${order.custom_id ?? order.id}`,
        reference: `Order ${order.custom_id ?? order.id}`,
        waitingOn: "Driver",
        lateFor: formatDuration(ageMs),
        requestedAtLabel: `Waiting since ${formatTimeLabel(baseTimestamp)}`,
        meta: metaParts.length ? metaParts.join(" • ") : undefined,
      });
      return acc;
    }, []);
  }, [orders]);

  return (
    <div
      className="min-h-screen w-full"
      style={
        {
          "--mint": COLORS.mint,
          "--mintSoft": COLORS.mintSoft,
          "--mintBold": COLORS.mintBold,
          "--ink": COLORS.ink,
          "--subtle": COLORS.subtle,
          "--border": COLORS.border,
        } as React.CSSProperties
      }
    >
      {/* hero */}
      <div className="relative">
        <div className="h-40 w-full" style={{ background: `linear-gradient(180deg, ${COLORS.mint} 0%, ${COLORS.mintSoft} 100%)` }} />
        <header className="absolute inset-x-0 top-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white shadow flex items-center justify-center">
                <MapIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[color:var(--ink)]">Manager Dashboard</h1>
                <p className="text-[color:var(--subtle)] text-sm">Live tracking • Quotations • Orders • Clients</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur rounded-2xl px-3 py-2 shadow border" style={{ borderColor: COLORS.border }}>
              <Search className="h-4 w-4 text-[color:var(--subtle)]" />
              <input className="bg-transparent outline-none placeholder-[color:var(--subtle)] text-sm" placeholder="Search orders, clients, users…" />
            </div>
          </div>
        </header>
      </div>

      {/* layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 pb-10 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* sidebar */}
        <aside className="xl:col-span-3 space-y-4">
          <NavCard>
            <NavItem icon={<Home className="h-4 w-4" />} label="Overview" active />
              <NavItem icon={<ListChecks className="h-4 w-4" />} label="Orders" href="orders" />
              <NavItem icon={<FileText className="h-4 w-4" />} label="Quotations" href="quotations" />


            <NavItem icon={<UserPlus className="h-4 w-4" />} label="Clients"  href="clients" />
            <NavItem icon={<Users className="h-4 w-4" />} label="Users" onClick={() => setShowUsersDrawer(true)} />
            <NavItem icon={<Settings className="h-4 w-4" />} label="Settings" />
          </NavCard>
        </aside>

        {/* map + tables */}
        <section className="xl:col-span-9 space-y-6">
          <div className="relative rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.border }}>
            {/* floating controls */}
            <div className="absolute z-10 top-3 left-3 flex gap-2">
              <button className="chip">Today</button>
              <button className="chip">Riyadh</button>
              <button className="chip">Drivers</button>
              <button className="chip">Sales</button>
            </div>
            <div className="absolute z-10 top-3 right-3 flex gap-2">
              <button className="btn-primary flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4" />Refresh</button>
              <button className="btn flex items-center gap-2 text-sm"><Filter className="h-4 w-4" />Filters</button>
            </div>

            <div className="h-[520px] w-full">
              <MapView drivers={drivers} sales={sales} center={center} color={COLORS.mintBold} />
            </div>

            {/* bottom overlay stats 
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <OverlayStat title="Quotes" value={String(quotations.length)} />
              <OverlayStat title="Orders" value={String(orders.length)} />
              <OverlayStat title="Clients" value={String(clients.length)} />
            </div>
            */}
          </div>

          <div className="space-y-4">
            <LateItemsCard
              title="Late Orders"
              description="Orders still waiting for approval after 12 hours."
              items={lateOrders}
              emptyMessage="No orders are overdue for approval."
              onItemClick={item => {
                const orderId = item.id.replace(/^delivery-/, "");
                router.push(`/orders/${orderId}`);
              }}
            />
            <LateItemsCard
              title="Late Quotations"
              description="Quotations pending manager or supervisor approval beyond 12 hours."
              items={lateQuotations}
              emptyMessage="All quotations are within the approval window."
              onItemClick={item => {
                router.push(`/quotations/${item.id}`);
              }}
            />
            <LateItemsCard
              title="Late Deliveries"
              description="Orders not yet delivered 12+ hours after the scheduled time."
              items={lateDeliveries}
              emptyMessage="No deliveries are delayed past 12 hours."
              onItemClick={item => {
                const orderId = item.id.replace(/^delivery-/, "");
                router.push(`/orders/${orderId}`);
              }}
            />
          </div>

          {/* tables 
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="Quotations (latest)">
              <SimpleTable headers={["Client", "Owner", "Status", "Total"]} rows={quotations.map(q => [q.client, q.owner, q.status, `${q.total} SAR`])} />
            </Panel>
            <Panel title="Orders (latest)">
              <SimpleTable headers={["Client", "Driver", "Status", "Total"]} rows={orders.map(o => [o.client, o.driver, o.status, `${o.total} SAR`])} />
            </Panel>
            <Panel title="Clients">
              <SimpleTable headers={["Name", "City", "Area", "Registered By"]} rows={clients.map(c => [c.name, c.city ?? "-", c.area ?? "-", c.createdBy])} />
            </Panel>
          </div>
          */}
        </section>
      </div>

      {/* users drawer */}
      {showUsersDrawer && (
        <Drawer title="Users" onClose={() => setShowUsersDrawer(false)}>
          <table className="w-full text-sm">
            <thead className="text-left text-[color:var(--subtle)]">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Active</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => (
                <tr key={u.id} className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">{u.active ? "Yes" : "No"}</td>
                  <td className="py-2 text-right space-x-2">
                    <button className="chip" onClick={() => setEditingUser({ ...u })}><Pencil className="h-3 w-3" /> Edit</button>
                    <button className="chip" style={{ background: "#fee2e2", borderColor: "#fecaca" }} onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}><Trash2 className="h-3 w-3" /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Drawer>
      )}

      {/* edit user modal */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)} title={`Edit user: ${editingUser.name}`}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setUsers(prev => prev.map(u => (u.id === editingUser.id ? editingUser : u)));
              setEditingUser(null);
            }}
          >
            <Field label="Name"><input className="input" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={editingUser.phone} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} /></Field>
            <Field label="Role"><input className="input" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} /></Field>
            <Field label="Active">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editingUser.active} onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })} /> Active
              </label>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={() => setEditingUser(null)}><X className="h-4 w-4" /> Cancel</button>
              <button type="submit" className="btn-primary"><Check className="h-4 w-4" /> Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Global utility styles */}
      <style jsx global>{`
        .chip { padding: 6px 12px; border: 1px solid var(--border); border-radius: 9999px; background: white; display: inline-flex; align-items: center; gap: 6px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 9999px; padding: 6px 12px; background: white; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; border: 1px solid transparent; border-radius: 9999px; padding: 6px 12px; color: white; background: ${COLORS.mintBold}; }
        .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: saturate(180%) blur(10px); }
        .input { width: 100%; border: 1px solid var(--border); border-radius: 14px; padding: 8px 12px; }
      `}</style>

      {/* splash overlay */}
      {showSplash && <SplashOverlay />}
    </div>
  );
}

/* UI HELPERS */
function NavCard({ children }: { children: ReactNode }) {
  return (
    <div className="glass rounded-3xl border shadow-sm" style={{ borderColor: COLORS.border }}>
      <div className="p-3 space-y-1">{children}</div>
    </div>
  );
}
function NavItem({
  icon,
  label,
  href,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href);
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl ${
        active ? "bg-white" : "hover:bg-white"
      }`}
      style={{ borderColor: COLORS.border }}
    >
      <span className="opacity-80">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function LateItemsCard({
  title,
  description,
  items,
  emptyMessage,
  onItemClick,
}: {
  title: string;
  description: string;
  items: LateNotification[];
  emptyMessage: string;
  onItemClick?: (item: LateNotification) => void;
}) {
  return (
    <div className="glass rounded-3xl border p-4 shadow-sm" style={{ borderColor: COLORS.border }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-medium text-slate-600">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 pr-2 snap-x snap-mandatory" role="list">
          {items.map(item => {
            const roleStyle = ROLE_STYLES[item.waitingOn] ?? ROLE_STYLES.Manager;
            return (
              <button
                key={item.id}
                role="listitem"
                onClick={() => onItemClick?.(item)}
                className="min-w-[260px] shrink-0 snap-start rounded-2xl border bg-white p-4 shadow-sm transition hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
                style={{ borderColor: COLORS.border, cursor: onItemClick ? "pointer" : "default" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.reference}</p>
                    {item.meta && <p className="text-xs text-slate-500">{item.meta}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyle.badgeBg} ${roleStyle.badgeText}`}>
                    {item.waitingOn}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-rose-600">{item.lateFor} late</span>
                  <span>{item.requestedAtLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1200] flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl bg-white border-l overflow-auto" style={{ borderColor: COLORS.border }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-[1] flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="font-semibold">{title}</h3>
          <button className="btn" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border bg-white shadow-xl" style={{ borderColor: COLORS.border }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 className="font-semibold">{title}</h3>
          <button className="btn" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-[color:var(--subtle)]">{label}</span>
      {children}
    </label>
  );
}

function SplashOverlay() {
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center"
      style={{ background: `linear-gradient(180deg, ${COLORS.mint} 0%, ${COLORS.mintSoft} 100%)` }}
    >
      <div className="flex flex-col items-center gap-4 animate-fadeOut">
        <img src="/splash.png" alt="Logo" className="h-16 w-16 rounded-2xl shadow-lg" />
        <div className="text-2xl font-extrabold text-[color:var(--ink)]">New Product</div>
        <div className="text-[color:var(--subtle)] text-sm">Loading dashboard…</div>
      </div>
      <style jsx>{`
        @keyframes fadeOutKey {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
        .animate-fadeOut { animation: fadeOutKey 1.2s ease forwards; }
      `}</style>
    </div>
  );
}
