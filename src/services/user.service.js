const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUser = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const updateUser = async (userId, updateBody) => {
  const user = await getUser(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUser = async (userId) => {
  const user = await getUser(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.deleteOne();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUser,
  getUserByEmail,
  updateUser,
  deleteUser,
};