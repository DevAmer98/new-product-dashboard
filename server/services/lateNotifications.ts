import type { PoolClient } from "pg";

import pool from "../db/pool";
import admin from "../firebase-init";
import { executeWithRetry, withTimeout } from "../utils/reliability";

type ApprovalRoleKey = "manager" | "supervisor" | "storekeeper" | "driver";

interface OrderRow {
  id: string | number;
  custom_id?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  manageraccept?: string | null;
  supervisoraccept?: string | null;
  storekeeperaccept?: string | null;
  status?: string | null;
  actual_delivery_date?: string | null;
}

type RoleConfig = {
  label: string;
  pluralLabel: string;
  dataRole: string;
  approvalColumn?: keyof Pick<OrderRow, "manageraccept" | "supervisoraccept" | "storekeeperaccept">;
  requiresUndelivered?: boolean;
  recipientTable: string;
};

interface QuotationRow {
  id: string | number;
  custom_id?: string | null;
  client_id?: string | number | null;
  client_name?: string | null;
  client_company?: string | null;
  manageraccept?: string | null;
  supervisoraccept?: string | null;
  status?: string | null;
}

const ROLE_CONFIG: Record<ApprovalRoleKey, RoleConfig> = {
  manager: {
    label: "Manager",
    pluralLabel: "Managers",
    approvalColumn: "manageraccept",
    dataRole: "manager",
    recipientTable: "managers",
  },
  supervisor: {
    label: "Supervisor",
    pluralLabel: "Supervisors",
    approvalColumn: "supervisoraccept",
    dataRole: "supervisor",
    recipientTable: "supervisors",
  },
  storekeeper: {
    label: "Storekeeper",
    pluralLabel: "Storekeepers",
    approvalColumn: "storekeeperaccept",
    dataRole: "storekeeper",
    recipientTable: "storekeepers",
  },
  driver: {
    label: "Driver",
    pluralLabel: "Drivers",
    dataRole: "driver",
    requiresUndelivered: true,
    recipientTable: "drivers",
  },
};

export type LateNotificationResult = {
  status: number;
  body: Record<string, unknown>;
};

const isAccepted = (value?: string | null) => value?.toLowerCase() === "accepted";

const normalizeEntityId = (rawId: string | number | undefined) => {
  if (rawId == null) return "";
  if (typeof rawId === "string") return rawId.trim();
  return String(rawId);
};

const fetchRecipientTokens = async (client: PoolClient, role: ApprovalRoleKey) => {
  const { recipientTable } = ROLE_CONFIG[role];
  const result = await executeWithRetry(() =>
    withTimeout(
      client.query<{ fcm_token: string | null }>(
        `SELECT fcm_token
         FROM ${recipientTable}
         WHERE fcm_token IS NOT NULL`
      ),
      10_000
    )
  );
  return result.rows.map(row => row.fcm_token).filter((token): token is string => Boolean(token));
};

const normalizeRole = (roleInput: string | undefined): ApprovalRoleKey | "" => {
  if (!roleInput || typeof roleInput !== "string") return "";
  const normalized = roleInput.trim().toLowerCase();
  if (normalized in ROLE_CONFIG) {
    return normalized as ApprovalRoleKey;
  }
  return "";
};

export const sendLateOrderNotification = async (
  rawOrderId: string | number | undefined,
  roleInput: string | undefined
): Promise<LateNotificationResult> => {
  const orderId = normalizeEntityId(rawOrderId);
  const normalizedRole = normalizeRole(roleInput);

  if (!orderId) {
    return { status: 400, body: { error: "Order id is required." } };
  }

  if (!normalizedRole) {
    return { status: 400, body: { error: "role must be manager, supervisor, storekeeper, or driver." } };
  }

  const roleConfig = ROLE_CONFIG[normalizedRole];

  const client = await pool.connect();
  try {
    const orderResult = await executeWithRetry(() =>
      withTimeout(
        client.query<OrderRow>(
          `SELECT o.id,
                  o.custom_id,
                  c.client_name,
                  c.company_name AS client_company,
                  o.manageraccept,
                  o.supervisoraccept,
                  o.storekeeperaccept,
                  o.status,
                  o.actual_delivery_date
           FROM orders o
           LEFT JOIN clients c ON c.id = o.client_id
           WHERE o.id = $1`,
          [orderId]
        ),
        10_000
      )
    );

    if (orderResult.rowCount === 0) {
      return { status: 404, body: { error: "Order not found." } };
    }

    const order = orderResult.rows[0];
    const { label, pluralLabel, approvalColumn, dataRole, requiresUndelivered } = roleConfig;

    if (approvalColumn && isAccepted(order[approvalColumn])) {
      return { status: 409, body: { message: `${label} already approved this order.` } };
    }

    if (requiresUndelivered) {
      const delivered =
        Boolean(order.actual_delivery_date) || (order.status ? order.status.toLowerCase() === "delivered" : false);
      if (delivered) {
        return { status: 409, body: { message: "Order already delivered." } };
      }
    }

    const tokens = await fetchRecipientTokens(client, normalizedRole);
    if (!tokens.length) {
      return {
        status: 202,
        body: {
          message: `No active ${pluralLabel.toLowerCase()} have a registered notification token.`,
        },
      };
    }

    const reference = order.custom_id ?? order.id;
    const recipientName = order.client_company ?? order.client_name ?? "عميل";
    const notificationTitle = `متابعة طلب ${reference}`;
    const notificationBody = `الطلب الخاص بـ ${recipientName} ينتظر موافقة ${label}.`;

    const messages = tokens.map(token => ({
      token,
      notification: { title: notificationTitle, body: notificationBody },
      data: {
        orderId: String(order.id),
        customId: order.custom_id ? String(order.custom_id) : "",
        role: dataRole,
      },
    }));

    const response = await executeWithRetry(() => withTimeout(admin.messaging().sendEach(messages), 15_000));

    return {
      status: 200,
      body: {
        message: `Notifications sent to ${pluralLabel}.`,
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  } catch (error) {
    console.error("Failed to send late-order notification", error);
    return {
      status: 500,
      body: {
        error: "Failed to notify staff.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  } finally {
    client.release();
  }
};

const QUOTATION_ALLOWED_ROLES: ApprovalRoleKey[] = ["manager", "supervisor"];

export const sendLateQuotationNotification = async (
  rawQuotationId: string | number | undefined,
  roleInput: string | undefined
): Promise<LateNotificationResult> => {
  const quotationId = normalizeEntityId(rawQuotationId);
  const normalizedRole = normalizeRole(roleInput);

  if (!quotationId) {
    return { status: 400, body: { error: "Quotation id is required." } };
  }

  if (!normalizedRole || !QUOTATION_ALLOWED_ROLES.includes(normalizedRole)) {
    return { status: 400, body: { error: "role must be manager or supervisor." } };
  }

  const roleConfig = ROLE_CONFIG[normalizedRole];
  const client = await pool.connect();

  try {
    const quotationResult = await executeWithRetry(() =>
      withTimeout(
        client.query<QuotationRow>(
          `SELECT q.id,
                  q.custom_id,
                  q.client_id,
                  c.client_name,
                  c.company_name AS client_company,
                  q.manageraccept,
                  q.supervisoraccept,
                  q.status
           FROM quotations q
           LEFT JOIN clients c ON c.id = q.client_id
           WHERE q.id = $1`,
          [quotationId]
        ),
        10_000
      )
    );

    if (quotationResult.rowCount === 0) {
      return { status: 404, body: { error: "Quotation not found." } };
    }

    const quotation = quotationResult.rows[0];
    const { label, pluralLabel, approvalColumn, dataRole } = roleConfig;
    const quotationApprovalColumn = approvalColumn as keyof Pick<QuotationRow, "manageraccept" | "supervisoraccept"> | undefined;

    if (quotationApprovalColumn && isAccepted(quotation[quotationApprovalColumn])) {
      return { status: 409, body: { message: `${label} already approved this quotation.` } };
    }

    const tokens = await fetchRecipientTokens(client, normalizedRole);
    if (!tokens.length) {
      return {
        status: 202,
        body: {
          message: `No active ${pluralLabel.toLowerCase()} have a registered notification token.`,
        },
      };
    }

    const reference = quotation.custom_id ?? quotation.id;
    const recipientName = quotation.client_company ?? quotation.client_name ?? "عميل";
    const notificationTitle = `متابعة عرض سعر ${reference}`;
    const notificationBody = `عرض السعر الخاص بـ ${recipientName} ينتظر موافقة ${label}.`;

    const messages = tokens.map(token => ({
      token,
      notification: { title: notificationTitle, body: notificationBody },
      data: {
        quotationId: String(quotation.id),
        customId: quotation.custom_id ? String(quotation.custom_id) : "",
        role: dataRole,
        entity: "quotation",
      },
    }));

    const response = await executeWithRetry(() => withTimeout(admin.messaging().sendEach(messages), 15_000));

    return {
      status: 200,
      body: {
        message: `Notifications sent to ${pluralLabel}.`,
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  } catch (error) {
    console.error("Failed to send late-quotation notification", error);
    return {
      status: 500,
      body: {
        error: "Failed to notify staff.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  } finally {
    client.release();
  }
};
