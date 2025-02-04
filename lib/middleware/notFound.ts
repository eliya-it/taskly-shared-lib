import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";

const notFound = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const errorMessage = `The route ${req.originalUrl} does not exist.`;
    res.status(404).json({ status: "fail", error: errorMessage });
  }
);
export default notFound;
