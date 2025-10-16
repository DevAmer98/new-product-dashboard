"use client";

import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaFilePdf,
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*                           SINGLE QUOTATION PAGE                            */
/* -------------------------------------------------------------------------- */

type QuotationProduct = {
  description?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
  vat?: number | string | null;
  subtotal?: number | string | null;
  [key: string]: unknown;
};

type QuotationDetail = {
  id?: string;
  custom_id?: string;
  client_name?: string | null;
  client_company?: string | null;
  client_phone?: string | null;
  client_region?: string | null;
  delivery_type?: string | null;
  delivery_date?: string | null;
  created_at?: string | null;
  manageraccept?: string | null;
  manageraccept_at?: string | null;
  supervisoraccept?: string | null;
  supervisoraccept_at?: string | null;
  total_price?: number | string | null;
  total_vat?: number | string | null;
  total_subtotal?: number | string | null;
  manager_notes?: string | null;
  storekeeper_notes?: string | null;
  notes?: string | null;
  products?: QuotationProduct[];
  [key: string]: unknown;
};

export default function SingleQuotationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`https://newproduct.newproducts.trade/api/quotations/${id}`);
        if (!res.ok) throw new Error("Failed to fetch quotation");
        const data = (await res.json()) as unknown;
        const detail = (data && typeof data === "object" && "quotation" in data
          ? (data as Record<string, unknown>).quotation
          : data) as QuotationDetail | null;
        setQuotation(detail);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
      : "—";

  const previewPdf = () => {
    if (!id) return;
    window.open(`https://newproduct.newproducts.trade/api/quotation/pdf/${id}`, "_blank");
  };

  if (loading)
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Loading quotation details...</div>;
  if (error)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-600">
        <p>{error}</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Go Back</button>
      </div>
    );
  if (!quotation) return <div className="flex justify-center items-center min-h-screen text-gray-400">No quotation found.</div>;

  const totalPrice = Number(quotation.total_price || 0);
  const totalVat = Number(quotation.total_vat || 0);
  const totalSubtotal = Number(quotation.total_subtotal || 0);

  /* -------------------------------------------------------------------------- */
  /*                                    UI                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 md:px-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 sm:mt-0">
          Quotation Details <span className="text-emerald-600">#{quotation.custom_id || id}</span>
        </h1>
      </div>

      {/* GRID */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          {/* CLIENT INFO */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Client & Delivery Information</h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <InfoRow icon={<FaUser />} label="Client Name" value={quotation.client_name} />
              <InfoRow icon={<FaBox />} label="Company" value={quotation.client_company || "—"} />
              <InfoRow icon={<FaPhone />} label="Phone" value={quotation.client_phone || "—"} />
              <InfoRow icon={<FaMapMarkerAlt />} label="Region" value={quotation.client_region || "—"} />
              <InfoRow icon={<FaCalendarAlt />} label="Delivery Type" value={quotation.delivery_type || "—"} />
              <InfoRow icon={<FaCalendarAlt />} label="Delivery Date" value={formatDate(quotation.delivery_date)} />
              <InfoRow icon={<FaCalendarAlt />} label="Created At" value={formatDate(quotation.created_at)} />
            </div>

            {/* APPROVALS */}
            <div className="mt-8 border-t pt-5 flex flex-wrap gap-3">
              <StatusBadge label="Manager" accepted={quotation.manageraccept === "accepted"} date={quotation.manageraccept_at} />
              <StatusBadge label="Supervisor" accepted={quotation.supervisoraccept === "accepted"} date={quotation.supervisoraccept_at} />
            </div>
          </motion.div>

          {/* PRODUCTS TABLE */}
          {quotation.products && quotation.products.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-2 mb-6">
                <FaClipboardList className="text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-800">
                      <th className="p-3 text-left font-semibold">#</th>
                      <th className="p-3 text-left font-semibold">Description</th>
                      <th className="p-3 text-center font-semibold">Qty</th>
                      <th className="p-3 text-center font-semibold">Unit Price</th>
                      <th className="p-3 text-center font-semibold">VAT (15%)</th>
                      <th className="p-3 text-center font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.products.map((product, index) => {
                      const qty = Number(product.quantity) || 0;
                      const price = Number(product.price) || 0;
                      const vat = Number(product.vat ?? price * 0.15 * qty);
                      const subtotal = Number(product.subtotal ?? price * qty + vat);
                      return (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{product.description || "—"}</td>
                          <td className="p-3 text-center">{qty}</td>
                          <td className="p-3 text-center">{price.toFixed(2)} SAR</td>
                          <td className="p-3 text-center text-gray-700">{vat.toFixed(2)} SAR</td>
                          <td className="p-3 text-center font-semibold text-gray-700">{subtotal.toFixed(2)} SAR</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* NOTES */}
          {(quotation.manager_notes || quotation.storekeeper_notes || quotation.notes) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Notes & Remarks</h2>
              <div className="space-y-4">
                {quotation.manager_notes && <NoteCard title="Manager Notes" text={quotation.manager_notes} color="emerald" />}
                {quotation.storekeeper_notes && <NoteCard title="Storekeeper Notes" text={quotation.storekeeper_notes} color="sky" />}
                {quotation.notes && <NoteCard title="General Notes" text={quotation.notes} color="gray" />}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: FINANCIAL SUMMARY */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 h-fit lg:sticky lg:top-10">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Financial Summary</h2>
          <div className="space-y-4">
            <TotalRow label="Total Price" value={totalPrice} />
            <TotalRow label="VAT (15%)" value={totalVat} />
            <TotalRow label="Subtotal (After VAT)" value={totalSubtotal} highlight />
          </div>

          <button onClick={previewPdf} className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-medium hover:from-blue-700 hover:to-sky-600 transition-all shadow flex items-center justify-center gap-2">
            <FaFilePdf /> Preview PDF
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HELPER COMPONENTS                             */
/* -------------------------------------------------------------------------- */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {

 return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatusBadge({ label, accepted, date }: { label: string; accepted?: boolean; date?: string }) {
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
      {date && <span className="text-gray-500 ml-2 text-xs">({new Date(date).toLocaleDateString()})</span>}
    </div>
  );
}

function NoteCard({ title, text, color }: { title: string; text: string; color?: "gray" | "emerald" | "sky" }) {
  const colors = {
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    sky: "bg-sky-50 border-sky-200 text-sky-800",
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[color || "gray"]}`}>
      <div className="flex items-center gap-2 mb-1">
        <FaClipboardList className="opacity-80" />
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-3 rounded-2xl ${
        highlight
          ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold"
          : "bg-gray-50 text-gray-800 border border-gray-200"
      }`}
    >
      <span>{label}</span>
      <span className="text-lg font-semibold">{value ? `${value.toLocaleString()} SAR` : "—"}</span>
    </div>
  );
}
