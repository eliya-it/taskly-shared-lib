import { Response, NextFunction } from "express";
import { Sequelize } from "sequelize";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import APIFeatures from "../utils/apiFeatures";
import { CustomRequest } from "../types/types";

export const getAll = (Model: any, callback?: (docs: any) => void) => {
  return catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const features = new APIFeatures(req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

      if (req.user && req.user.id) {
        features.query.where = {
          ...features.query.where,
          user_id: req.user.id.toString(),
        };
      }

      try {
        const docs = await Model.findAll(features.query);
        if (callback) callback(docs);
        res.status(200).json({
          status: "success",
          results: docs.length,
          data: {
            docs,
          },
        });
      } catch (error) {
        next(new AppError("Error executing query", 500));
      }
    }
  );
};

export const createOne = (Model: any, callback?: (doc: any) => void) => {
  return catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      let filteredBody = { ...req.body };

      if (req.user) {
        filteredBody = { ...req.body, userId: req.user.id };
      }

      const doc = await Model.create(filteredBody);

      if (callback) callback(doc);

      res.status(201).json({
        status: "success",
        data: {
          doc,
        },
      });
    }
  );
};

export const deleteOne = (Model: any, callback?: (doc: any) => void) => {
  return catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      let query: { where: { id: string; userId?: string } } = {
        where: { id: req.params.id },
      };

      if (req.user && req.user.id) {
        query.where.userId = req.user.id;
      }

      const doc = await Model.destroy(query);
      if (!doc) {
        return next(new AppError("No document found with that ID!", 404));
      }
      if (callback) callback(doc);
      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
};

export const updateOne = (Model: any, callback?: (doc: any) => void) => {
  return catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const [updated] = await Model.update(req.body, {
        where: { id: req.params.id },
        returning: true,
      });
      if (!updated) {
        return next(new AppError("No document found with that ID!", 404));
      }
      const updatedDoc = await Model.findByPk(req.params.id);
      if (callback) callback(updatedDoc);
      res.status(200).json({
        status: "success",
        data: {
          doc: updatedDoc,
        },
      });
    }
  );
};
