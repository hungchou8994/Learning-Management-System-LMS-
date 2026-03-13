const { sequelize } = require("../config/database");
const UserModel = require("./user.model");

const User = UserModel(sequelize);

const models = {
  User,
};

const db = {
  ...models,
  sequelize,
};

module.exports = db;
