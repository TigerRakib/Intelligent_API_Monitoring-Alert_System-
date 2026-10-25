import type { ErrorRequestHandler } from "express";

import { logger } from "../utils/logger";

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

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
    return;
  }

  logger.error({ err: error }, "Unhandled backend error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
