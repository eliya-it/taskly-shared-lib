import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../types/types";

type AsyncFunction<T extends Request = CustomRequest> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

const catchAsync = <T extends Request = CustomRequest>(
  fn: AsyncFunction<T>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
