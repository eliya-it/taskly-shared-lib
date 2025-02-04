import { Request, Response, NextFunction } from "express";
import axios from "axios";
import AppError from "../utils/appError";

interface CustomRequest extends Request {
  user?: {
    id: number;
    name: string;
  };
}

export const protect = (userServiceUrl: string) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to access.", 401)
      );
    }

    try {
      // Validate token with the user service
      const response = await axios.get<{
        status: string;
        token: string;
        name: string;
        userId: number;
      }>(`${userServiceUrl}/validateToken`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      req.user = {
        id: response.data.userId,
        name: response.data.name,
      };

      next();
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return next(
          new AppError("Invalid or expired token. Please log in again.", 401)
        );
      }

      return next(
        new AppError("Authentication failed. Please try again later.", 500)
      );
    }
  };
};
