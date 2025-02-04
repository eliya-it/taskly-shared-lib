import { FindOptions, WhereOptions, Order, OrderItem } from "sequelize";

interface QueryString {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  [key: string]: any;
}

class APIFeatures {
  query: FindOptions;
  queryStr: QueryString;

  constructor(queryStr: QueryString) {
    this.query = {};
    this.queryStr = queryStr;
  }

  filter(): this {
    const queryObject = { ...this.queryStr };
    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((field) => delete queryObject[field]);

    // Convert queryObject to Sequelize where options
    const where: WhereOptions = {};
    for (const key in queryObject) {
      const value = queryObject[key];
      if (typeof value === "string" && value.match(/\b(gte|gt|lte|lt)\b/)) {
        const [operator, operatorValue] = value.split("_");
        where[key] = { [`$${operator}`]: operatorValue };
      } else {
        where[key] = value;
      }
    }

    this.query.where = where;
    return this;
  }

  sort(): this {
    if (this.queryStr.sort) {
      const sortBy: Order = this.queryStr.sort.split(",").map((field) => {
        if (field.startsWith("-")) {
          return [field.substring(1), "DESC"] as OrderItem;
        } else {
          return [field, "ASC"] as OrderItem;
        }
      });
      this.query.order = sortBy;
    } else {
      this.query.order = [["id", "DESC"]]; // Default sorting
    }
    return this;
  }

  limitFields(): this {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query.attributes = fields.split(" ");
    } else {
      this.query.attributes = undefined;
    }
    return this;
  }

  paginate(): this {
    const page = parseInt(this.queryStr.page!, 10) || 1;
    const limit = parseInt(this.queryStr.limit!, 10) || 100;
    const offset = (page - 1) * limit;
    this.query.limit = limit;
    this.query.offset = offset;
    return this;
  }
}

export default APIFeatures;
