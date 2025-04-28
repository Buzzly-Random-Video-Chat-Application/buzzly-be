const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const MESSAGES = require('../constants/messages');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  if (await userService.getUserByEmail(req.body.email)) {
    res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: MESSAGES.AUTH.EMAIL_ALREADY_TAKEN,
    });
    throw new ApiError(httpStatus.BAD_REQUEST, MESSAGES.AUTH.EMAIL_ALREADY_TAKEN);
  }
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.AUTH.REGISTER_SUCCESS,
    tokens,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    await userService.updateUser(user.id, { isOnline: true });
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      result: user,
      tokens,
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === httpStatus.BAD_REQUEST) {
      return res.status(httpStatus.BAD_REQUEST).send({
        code: httpStatus.BAD_REQUEST,
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }
    throw error;
  }
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  const refreshTokenDoc = await Token.findOne({ token: req.body.refreshToken, type: tokenTypes.REFRESH });
  if (refreshTokenDoc) {
    await userService.updateUser(refreshTokenDoc.user, { isOnline: false });
  }
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.AUTH.LOGOUT_SUCCESS,
  });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens,
    message: MESSAGES.AUTH.REFRESH_TOKENS_SUCCESS,
   });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.AUTH.FORGOT_PASSWORD_SUCCESS,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.AUTH.RESET_PASSWORD_SUCCESS,
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.AUTH.SEND_VERIFICATION_EMAIL_SUCCESS,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.AUTH.VERIFY_EMAIL_SUCCESS,
  });
});

const me = catchAsync(async (req, res) => {
  const user = await authService.me(req.user._id);
  res.send({
    message: MESSAGES.AUTH.GET_USER_INFO_SUCCESS,
    result: user,
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  me,
};
