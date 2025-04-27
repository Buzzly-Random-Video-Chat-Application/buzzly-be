const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const cloudinary = require('../config/cloudinary');
const MESSAGES = require('../constants/messages');

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.USER.CREATE_SUCCESS,
    result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { results, page, limit, totalPages, totalResults } = await userService.queryUsers(filter, options);
  res.send({
    message: MESSAGES.USER.GET_USERS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send({
    message: MESSAGES.USER.GET_USER_SUCCESS,
    result: user
  });
});

const updateUser = catchAsync(async (req, res) => {
  const updateBody = { ...req.body };
  const user = await userService.updateUser(req.params.userId, updateBody);
  res.send({
    message: MESSAGES.USER.UPDATE_SUCCESS,
    result: user,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.USER.DELETE_SUCCESS,
  });
});

const updateIsShowReview = catchAsync(async (req, res) => {
  const { isShowReview } = req.body;
  const user = await userService.updateUser(req.params.userId, { isShowReview });
  res.send({
    message: MESSAGES.USER.UPDATE_REVIEW_VISIBILITY_SUCCESS,
    result: user,
  });
});

const updateUserAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Avatar file is required');
  }

  try {
    const uploadedImage = await cloudinary.uploadImage(req.file.buffer);
    const user = await userService.updateUser(req.params.userId, { avatar: uploadedImage.secure_url });
    res.send({
      message: MESSAGES.USER.UPDATE_AVATAR_SUCCESS,
      result: user,
    });
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload avatar');
  }
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateIsShowReview,
  updateUserAvatar,
};