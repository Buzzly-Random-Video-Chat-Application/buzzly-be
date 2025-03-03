const { createClient } = require('redis');
const config = require('./config');
const logger = require('./logger');

const redis = createClient({
  username: 'default',
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.info('Redis error:', error);
});

module.exports = redis;
