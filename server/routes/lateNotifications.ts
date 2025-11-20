import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendLateOrderNotification, sendLateQuotationNotification } from "../services/lateNotifications";

const router = express.Router();

router.post(
  "/orders/:id/notify",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const roleInput = typeof req.body?.role === "string" ? req.body.role : "";
    const result = await sendLateOrderNotification(id, roleInput);
    return res.status(result.status).json(result.body);
  })
);

router.post(
  "/quotations/:id/notify",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const roleInput = typeof req.body?.role === "string" ? req.body.role : "";
    const result = await sendLateQuotationNotification(id, roleInput);
    return res.status(result.status).json(result.body);
  })
);

export default router;
