import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize";

const modelCache: { [key: string]: ModelStatic<Model> } = {};

export const initializeSequelize = (databaseUrl: string): Sequelize => {
  console.log("Connecting to the database:", databaseUrl);

  const sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: false,
  });

  sequelize
    .authenticate()
    .then(() => {
      console.log("Connected to the database");
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
    });

  return sequelize;
};

export const getModel = (
  sequelize: Sequelize,
  tableName: string,
  schema: { [key: string]: any }
): ModelStatic<Model> => {
  if (!modelCache[tableName]) {
    modelCache[tableName] = sequelize.define(tableName, schema, {
      tableName,
      timestamps: false,
      underscored: true, // Use snake_case instead of camelCase for field names
    });
  }
  return modelCache[tableName];
};
