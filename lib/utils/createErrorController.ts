import { NextFunction, Request, Response } from "express";
import AppError from "./appError";
import CloudWatcher from "./cloudwatcher";

export const createErrorController = (cloudWatchOptions: any) => {
  const cloudWatcher = new CloudWatcher(cloudWatchOptions);

  return async (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const logMessage = JSON.stringify({
        message: err.message,
        status: err.status || 500,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
      });

      await cloudWatcher.logToCloudWatch(logMessage);
    } catch (logError) {
      console.error("Failed to log to CloudWatch:", logError);
    }

    res.status(500).json({
      status: "error",
      message: err.message || "An unexpected error occurred",
    });
  };
};
