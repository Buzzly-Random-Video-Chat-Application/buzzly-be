const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const setupSocketIO = require('./socket/socket');
const { redis } = require('./config/redis');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  logger.info('Connected to MongoDB');
  await redis.connect();
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  const io = new Server(server, {
    path: '/v1/socket',
    cors: {
      origin: config.env === 'production' ? 'https://buzzly-fe.vercel.app' : 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });
  setupSocketIO(io);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      redis.quit().then(() => process.exit(1));
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