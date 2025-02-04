import { NextFunction } from "express";
import AppError from "./appError";

interface Field {
  name: string;
  min: number;
  max: number;
}

// Validate fields in the request body
const validateFields = (fields: Field[], body: Record<string, any>): void => {
  for (const field of fields) {
    const value = body[field.name];

    // Check if the field is present
    if (!value) {
      throw new AppError(`Please provide a ${field.name}`, 400);
    }

    // Check for minimum length
    if (field.min && value.length < field.min) {
      throw new AppError(
        `${field.name} must be at least ${field.min} characters`,
        400
      );
    }

    // Check for maximum length
    if (field.max && value.length > field.max) {
      throw new AppError(
        `${field.name} must be less than ${field.max} characters`,
        400
      );
    }
  }
};

export default validateFields;
