import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import { ValidationError } from "sequelize";
import CloudWatcher from "../utils/cloudwatcher";
import { ClientConfiguration } from "aws-sdk/clients/acm";

const handleDuplicateKeyErrorDB = (err: any, req: Request, res: Response) => {
  const field = err.constraint
    ? err.constraint.replace("unique_", "")
    : "field";
  const value = err.detail?.match(/\((.*?)\)=\((.*?)\)/);

  let message;
  if (value) {
    message = `Duplicate ${field}: '${value[2]}'. Please use a different value!`;
  } else {
    message = "Duplicate field value detected. Please use a different value!";
  }

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: ValidationError) => {
  const errors = err.errors.map((el: any) => {
    if (el.type === "notNull Violation") {
      return `${el.path} is required`;
    }

    if (el.validatorKey === "len") {
      return `${el.path} must be between ${el.validatorArgs[0]} and ${el.validatorArgs[1]} characters`;
    }

    return `${el.path}: ${el.message}`;
  });

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError("Invalid token. Please login again!", 401);
};

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err: any, req: Request, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
  });
};

const sendErrorProd = (err: any, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong!",
    });
  }
};

const logErrorToCloudWatch = async (
  cw: CloudWatcher,
  err: any,
  req: Request
) => {
  const logMessage = JSON.stringify({
    message: err.message,
    status: err.statusCode || 500,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  try {
    await cw.logToCloudWatch(logMessage);
  } catch (logError) {
    console.error("Failed to log error to CloudWatch:", logError);
  }
};
export default (cloudWatchOptions: ClientConfiguration) => {
  const cw = new CloudWatcher(cloudWatchOptions);

  return async (err: any, req: Request, res: Response, next: NextFunction) => {
    await cw.createLogStream();
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Log error to CloudWatch
    // await logErrorToCloudWatch(cw, err, req);

    if (process.env.NODE_ENV === "development") {
      return sendErrorDev(err, req, res);
    } else if (
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "test"
    ) {
      let error = { ...err, message: err.message };
      if (err.name === "SequelizeUniqueConstraintError") {
        // Duplicate key constraint error
        const error = handleDuplicateKeyErrorDB(err, req, res);
        return sendErrorDev(error, req, res);
      }
      if (err.name === "SequelizeValidationError") {
        err = handleValidationErrorDB(err);
      }
      if (error.name === "SequelizeValidationError") {
        error = handleValidationErrorDB(error);
      }
      if (error.name === "CastError") {
        error = handleCastErrorDB(error);
      }
      if (error.name === "JsonWebTokenError") {
        error = handleJWTError();
      }
      if (error.name === "TokenExpiredError") {
        error = handleJWTExpiredError();
      }

      sendErrorProd(error, req, res);
    } else {
      next(err); // Fallback for unhandled environments
    }
  };
};
