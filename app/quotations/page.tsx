"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaEye,
  FaUser,
} from "react-icons/fa";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type QuotationListItem = {
  id?: string;
  custom_id?: string;
  client_name?: string | null;
  client_company?: string | null;
  client_region?: string | null;
  client_phone?: string | null;
  status?: string | null;
  manageraccept?: string | null;
  total_after_discount?: number | string | null;
  total_price?: number | string | null;
  created_at?: string | null;
  username?: string | null;
  [key: string]: unknown;
};

type QuotationsResponse = {
  quotations?: unknown;
  orders?: unknown;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
};

export default function Quotations() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const filters = [
    { label: "الكل", value: "all" },
    { label: "الموافق عليها", value: "accepted" },
    { label: "بانتظار الموافقة", value: "pending" },
    { label: "المرفوضة", value: "rejected" },
  ];

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const url = `https://newproduct.newproducts.trade/api/quotations?limit=${limit}&page=${page}&query=${encodeURIComponent(
        search
      )}&status=${filter}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch quotations");
      const data = (await res.json()) as QuotationsResponse;

      const listSource = Array.isArray(data.quotations)
        ? data.quotations
        : Array.isArray(data.orders)
        ? data.orders
        : [];
      setQuotations(listSource as QuotationListItem[]);
      const currentPage = data.currentPage ?? page;
      const totalPageCount = data.totalPages ?? 1;
      setHasMore(currentPage < totalPageCount);
      setTotalPages(totalPageCount);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Map status color style
  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    };
    return map[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 md:px-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-emerald-600">Registered Quotations</span> / عروض الأسعار المسجلة
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage, filter, and review all submitted quotations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
              filter === f.value
                ? "bg-emerald-600 text-white shadow-md border-emerald-700"
                : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-lg mb-10">
        <FaSearch className="absolute top-3 left-3 text-gray-400" />
        <input
          type="text"
          placeholder="🔍 ابحث عن عرض السعر حسب اسم العميل أو الشركة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Loading & Error */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading quotations...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-lg">
          🚫 No quotations found. Try changing your filters.
        </div>
      ) : (
        <>
          {/* Quotation Cards */}
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {quotations.map((q, i) => (
              <motion.div
                key={q.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl shadow-sm">
                      <FaFileInvoiceDollar />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 leading-tight truncate max-w-[140px]">
                        {q.client_name || "Unnamed Client"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate max-w-[140px]">
                        {q.client_company || "No company"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${getStatusStyle(
                      q.status || q.manageraccept
                    )}`}
                  >
                    {q.status || q.manageraccept || "Pending"}
                  </span>
                </div>

                {/* Quotation Info */}
                <div className="mb-4">
                  <p className="text-gray-800 font-semibold text-lg mb-1">
                    {q.total_after_discount
                      ? `${Number(q.total_after_discount).toLocaleString()} SAR`
                      : q.total_price
                      ? `${Number(q.total_price).toLocaleString()} SAR`
                      : "-"}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 gap-1">
                    <FaCalendarAlt className="text-gray-400" />
                    {q.created_at
                      ? new Date(q.created_at).toLocaleDateString()
                      : "No date"}
                  </div>

                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FaUser className="text-gray-400" /> {q.username || "No user"}
                  </div>
                </div>

                {/* View Button */}
                <button
                  onClick={() => router.push(`/quotations/${q.id}`)}
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-medium hover:from-emerald-700 hover:to-green-600 transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
                >
                  <FaEye className="h-4 w-4" /> View Quotation #{q.custom_id || q.id}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4">
            {/* Left */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={`p-2 rounded-lg border ${
                  page === 1
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <FaAnglesLeft />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg border ${
                  page === 1
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <FaChevronLeft />
              </button>
            </div>

            {/* Center */}
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="w-16 border border-gray-300 rounded-md text-center text-sm py-1 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
              <span className="text-sm">of {totalPages}</span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                disabled={!hasMore}
                className={`p-2 rounded-lg border ${
                  !hasMore
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <FaChevronRight />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={`p-2 rounded-lg border ${
                  page === totalPages
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <FaAnglesRight />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
