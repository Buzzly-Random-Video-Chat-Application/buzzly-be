const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const setupSocketIO = require('./socket/socket');
const redis = require('./config/redis');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  try {
    await redis.connect();
  } catch (redisError) {
    logger.info('Failed to connect to Redis:', redisError);
    process.exit(1);
  }
  setupSocketIO(io, redis);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
