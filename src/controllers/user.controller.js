const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const cloudinary = require('../config/cloudinary');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const updateBody = { ...req.body };

  if (req.file) {
    try {
      const uploadedImage = await cloudinary.uploadImage(req.file.buffer);
      updateBody.avatar = uploadedImage.secure_url;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload avatar');
    }
  }

  const user = await userService.updateUserById(req.params.userId, updateBody);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateIsShowReview = catchAsync(async (req, res) => {
  const { isShowReview } = req.body;
  const user = await userService.updateUserById(req.params.userId, { isShowReview });
  res.send(user);
});

const updateUserAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Avatar file is required');
  }

  try {
    const uploadedImage = await cloudinary.uploadImage(req.file.buffer);
    const user = await userService.updateUserById(req.params.userId, { avatar: uploadedImage.secure_url });
    res.send(user);
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