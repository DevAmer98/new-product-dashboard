"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaBox,
  FaCalendarAlt,
  FaPhone,
  FaUser,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaStickyNote,
  FaClipboardList,
} from "react-icons/fa";
import { motion } from "framer-motion";

/* ------------------------------------------------------------- */
/*                      PAGE COMPONENT                           */
/* ------------------------------------------------------------- */

type OrderProduct = {
  description?: string | null;
  price?: number | string | null;
  quantity?: number | string | null;
  vat?: number | string | null;
  subtotal?: number | string | null;
  [key: string]: unknown;
};

type OrderDetail = {
  id?: string;
  custom_id?: string;
  client_name?: string | null;
  client_company?: string | null;
  client_phone?: string | null;
  delivery_type?: string | null;
  delivery_date?: string | null;
  actual_delivery_date?: string | null;
  created_at?: string | null;
  manageraccept?: string | null;
  manageraccept_at?: string | null;
  supervisoraccept?: string | null;
  supervisoraccept_at?: string | null;
  storekeeperaccept?: string | null;
  storekeeperaccept_at?: string | null;
  manager_notes?: string | null;
  storekeeper_notes?: string | null;
  notes?: string | null;
  total_subtotal?: number | string | null;
  total_vat?: number | string | null;
  total_price?: number | string | null;
  products?: OrderProduct[];
  [key: string]: unknown;
};

export default function SingleOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`https://newproduct.newproducts.trade/api/orders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = (await res.json()) as unknown;
        const detail = (data && typeof data === "object" && "order" in data
          ? (data as Record<string, unknown>).order
          : data) as OrderDetail | null;
        setOrder(detail);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

  // 🕒 Calculate time difference between creation and delivery
  const calculateDeliveryDuration = (created: string, delivered: string) => {
    if (!created || !delivered) return "";
    const start = new Date(created);
    const end = new Date(delivered);
    const diffMs = Math.abs(end.getTime() - start.getTime());

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

    const parts = [];
    if (diffDays > 0) parts.push(`${diffDays} day${diffDays > 1 ? "s" : ""}`);
    if (diffHours > 0) parts.push(`${diffHours} hr${diffHours > 1 ? "s" : ""}`);
    if (diffMinutes > 0 && diffDays === 0) parts.push(`${diffMinutes} min`);

    const duration = parts.join(" ");
    if (diffDays > 2) {
      return { text: `Delivered in ${duration}`, isLate: true };
    }
    return { text: `Delivered in ${duration}`, isLate: false };
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        Loading order details...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Go Back
        </button>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">
        No order found.
      </div>
    );

  const duration =
    order.actual_delivery_date && order.created_at
      ? calculateDeliveryDuration(order.created_at, order.actual_delivery_date)
      : null;

  /* ------------------------------- RENDER ------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 md:px-10">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 sm:mt-0">
          Order Details{" "}
          <span className="text-emerald-600">#{order.custom_id || order.id}</span>
        </h1>
      </div>

      {/* ---------- MAIN GRID ---------- */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* ---------- LEFT SIDE ---------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* CLIENT + DELIVERY INFO */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Client & Delivery Information
            </h2>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow icon={<FaUser />} label="Client Name" value={order.client_name} />
              <InfoRow icon={<FaBox />} label="Company" value={order.client_company || "—"} />
              <InfoRow icon={<FaPhone />} label="Phone" value={order.client_phone || "—"} />
              <InfoRow icon={<FaTruck />} label="Delivery Type" value={order.delivery_type} />

              <InfoRow
                icon={<FaCalendarAlt />}
                label="Delivery Date (Planned)"
                value={formatDate(order.delivery_date)}
              />

              {/* Actual Delivery Date */}
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 flex items-center justify-center rounded-xl ${
                    order.actual_delivery_date
                      ? duration?.isLate
                        ? "bg-orange-50 text-orange-600"
                        : "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <FaCalendarAlt />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Delivery Date</p>
                  {order.actual_delivery_date ? (
                    <>
                      <p className="font-medium text-gray-800">
                        {formatDate(order.actual_delivery_date)}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          duration?.isLate ? "text-orange-600" : "text-emerald-600"
                        }`}
                      >
                        {duration?.text}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-gray-400">Pending delivery…</p>
                  )}
                </div>
              </div>

              <InfoRow
                icon={<FaCalendarAlt />}
                label="Created At"
                value={formatDate(order.created_at)}
              />
            </div>

            {/* Approvals */}
            <div className="mt-8 flex flex-wrap gap-3 border-t pt-5">
              <StatusBadge
                label="Manager"
                accepted={order.manageraccept === "accepted"}
                date={order.manageraccept_at}
              />
              <StatusBadge
                label="Supervisor"
                accepted={order.supervisoraccept === "accepted"}
                date={order.supervisoraccept_at}
              />
              <StatusBadge
                label="Storekeeper"
                accepted={order.storekeeperaccept === "accepted"}
                date={order.storekeeperaccept_at}
              />
            </div>
          </motion.div>

          {/* PRODUCTS SECTION */}
          {order.products && order.products.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <FaClipboardList className="text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">Products in Order</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-800">
                      <th className="p-3 text-left font-semibold">#</th>
                      <th className="p-3 text-left font-semibold">Description</th>
                      <th className="p-3 text-center font-semibold">Quantity</th>
                      <th className="p-3 text-center font-semibold">Unit Price</th>
                      <th className="p-3 text-center font-semibold">Total (incl. VAT)</th>
                    </tr>
                  </thead>
          <tbody>
                    {order.products.map((product, index) => {
                      const price = Number(product.price) || 0;
                      const qty = Number(product.quantity) || 0;
                      const vatValue = Number(product.vat ?? price * qty * 0.15);
                      const subtotalValue = Number(product.subtotal ?? price * qty + vatValue);

                      return (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{product.description || "—"}</td>
                          <td className="p-3 text-center">{qty}</td>
                          <td className="p-3 text-center">{price.toFixed(2)} SAR</td>
                          <td className="p-3 text-center font-semibold text-gray-700">
                            {subtotalValue.toFixed(2)} SAR
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* NOTES SECTION */}
          {(order.manager_notes || order.storekeeper_notes || order.notes) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8"
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Notes & Remarks
              </h2>
              <div className="space-y-4">
                {order.manager_notes && (
                  <NoteCard
                    title="Manager Notes"
                    text={order.manager_notes}
                    color="emerald"
                  />
                )}
                {order.storekeeper_notes && (
                  <NoteCard
                    title="Storekeeper Notes"
                    text={order.storekeeper_notes}
                    color="sky"
                  />
                )}
                {order.notes && (
                  <NoteCard title="General Notes" text={order.notes} color="gray" />
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ---------- RIGHT SIDE: FINANCIAL SUMMARY ---------- */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 h-fit lg:sticky lg:top-10"
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Financial Summary
          </h2>
          <div className="space-y-4">
            <TotalRow label="Subtotal (Before VAT)" value={order.total_subtotal} />
            <TotalRow label="VAT (15%)" value={order.total_vat} />
            <TotalRow label="Total (Incl. VAT)" value={order.total_price} highlight />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/*                      HELPER COMPONENTS                        */
/* ------------------------------------------------------------- */

  function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  accepted,
  date,
}: {
  label: string;
  accepted?: boolean;
  date?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
        accepted
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-yellow-50 text-yellow-700 border-yellow-200"
      }`}
    >
      {accepted ? <FaCheckCircle /> : <FaTimesCircle />}
      {label}: {accepted ? "Approved" : "Pending"}
      {date && (
        <span className="text-gray-500 ml-2 text-xs">
          ({new Date(date).toLocaleDateString()})
        </span>
      )}
    </div>
  );
}

function NoteCard({
  title,
  text,
  color,
}: {
  title: string;
  text: string;
  color?: "gray" | "emerald" | "sky";
}) {
  const colors = {
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    sky: "bg-sky-50 border-sky-200 text-sky-800",
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[color || "gray"]}`}>
      <div className="flex items-center gap-2 mb-1">
        <FaStickyNote className="opacity-80" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function TotalRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-3 rounded-2xl ${
        highlight
          ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold"
          : "bg-gray-50 text-gray-800 border border-gray-200"
      }`}
    >
      <span>{label}</span>
      <span className="text-lg font-semibold">
        {value ? `${Number(value).toLocaleString()} SAR` : "—"}
      </span>
    </div>
  );
}
