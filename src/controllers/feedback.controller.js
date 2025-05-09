const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { feedbackService, emailService } = require('../services');
const MESSAGES = require('../constants/messages');
const config = require('../config/config');

const createFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.body);
  const { email, name } = req.body;
  await emailService.sendThankYouFeedbackEmail(email, name);
  await emailService.sendAdminFeedbackNotificationEmail( config.email.from, feedback);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.FEEDBACK.CREATE_SUCCESS,
    feedback,
  });
});

const queryFeedbacks = catchAsync(async (req, res) => {
  const filter = req.query;
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const { results, page, limit, totalPages, totalResults } = await feedbackService.queryFeedbacks(filter, options);
  res.send({
    message: MESSAGES.FEEDBACK.GET_FEEDBACKS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const updateFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.updateFeedback(req.params.feedbackId, req.body);
  res.send({
    message: MESSAGES.FEEDBACK.UPDATE_SUCCESS,
    result: feedback,
  });
});
const deleteFeedback = catchAsync(async (req, res) => {
  await feedbackService.deleteFeedback(req.params.feedbackId);
  res.status(httpStatus.OK).send({
    message: MESSAGES.FEEDBACK.DELETE_SUCCESS,
  });
});

const getFeedback = catchAsync(async (req, res) => {
    const feedback = await feedbackService.getFeedback(req.params.feedbackId);
    res.send({
        message: MESSAGES.FEEDBACK.GET_FEEDBACK_SUCCESS,
        result: feedback,
    });
});

module.exports = {
  createFeedback,
  queryFeedbacks,
  updateFeedback,
  deleteFeedback,
  getFeedback,
};