import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error("Backend error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
