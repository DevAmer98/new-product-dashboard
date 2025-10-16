"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaBox,
  FaCalendarAlt,
  FaEye,
  FaUser,
} from "react-icons/fa";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type OrderListItem = {
  id?: string;
  custom_id?: string;
  client_name?: string | null;
  client_company?: string | null;
  status?: string | null;
  total_subtotal?: number | string | null;
  created_at?: string | null;
  username?: string | null;
  [key: string]: unknown;
};

type OrdersResponse = {
  orders?: unknown;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
};

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
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
    { label: "تم التوصيل", value: "Delivered" },
    { label: "بانتظار الموافقة", value: "pending" },
    { label: "لم يتم التوصيل", value: "not Delivered" },
    { label: "المرفوضة", value: "rejected" },
  ];

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const url = `https://newproduct.newproducts.trade/api/orders?limit=${limit}&page=${page}&query=${encodeURIComponent(
        search
      )}&status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = (await res.json()) as OrdersResponse;
      if (!Array.isArray(data.orders)) throw new Error("Invalid response format");

      setOrders(data.orders as OrderListItem[]);
      const currentPage = data.currentPage ?? page;
      const totalPageCount = data.totalPages ?? 1;
      setHasMore(currentPage < totalPageCount);
      setTotalPages(totalPageCount);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Color mapping for order statuses
  /*
  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      accepted: "bg-blue-50 text-blue-700 border-blue-200",
      "not Delivered": "bg-gray-100 text-gray-700 border-gray-300",
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };
*/


function getStatusStyle(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 md:px-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-emerald-600">Registered Orders</span> / الطلبات المسجلة
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track, filter, and inspect all customer orders effortlessly.
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
          placeholder="🔍 ابحث عن الطلب حسب اسم العميل أو الشركة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Loading & Error */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading orders...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-lg">
          🚫 No orders found. Try adjusting your filters.
        </div>
      ) : (
        <>
          {/* Order Cards */}
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {orders.map((order, i) => (
              <motion.div
                key={order.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-emerald-500 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl shadow-sm">
                      <FaBox />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 leading-tight truncate max-w-[130px]">
                        {order.client_name || "Unnamed Client"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate max-w-[140px]">
                        {order.client_company || "No company"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {order.status || "Unknown"}
                  </span>
                </div>

                {/* Details */}
                <div className="mb-4">
                  <p className="text-gray-800 font-semibold text-lg mb-1">
                    {order.total_subtotal
                      ? `${Number(order.total_subtotal).toLocaleString()} SAR`
                      : "-"}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 gap-1">
                    <FaCalendarAlt className="text-gray-400" />
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : "No date"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FaUser className="text-gray-400" /> {order.username || "No user"}
                  </div>
                </div>

                {/* View Button */}
                <button
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-medium hover:from-emerald-700 hover:to-green-600 transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
                >
                  <FaEye className="h-4 w-4" /> View Order #{order.custom_id || order.id}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4">
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
