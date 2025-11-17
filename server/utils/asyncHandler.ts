import type { NextFunction, Request, Response, RequestHandler } from "express";

// Wraps async route handlers and forwards errors to Express error middleware.
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
