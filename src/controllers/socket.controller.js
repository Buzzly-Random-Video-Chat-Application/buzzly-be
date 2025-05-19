const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const socket = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    message: 'Socket.IO service is available',
    path: '/v1/socket',
    version: '1.0.0',
  });
});

module.exports = {
  socket,
};
