const { createClient } = require('redis');
const config = require('./config');
const logger = require('./logger');

const redis = createClient({
  username: 'default',
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('end', () => {
  logger.info('Redis connection closed');
});

const incrementOnline = async () => {
  try {
    await redis.incr('online');
  } catch (error) {
    logger.error('Failed to increment online count:', error);
  }
};

const decrementOnline = async () => {
  try {
    await redis.decr('online');
  } catch (error) {
    logger.error('Failed to decrement online count:', error);
  }
};

const getOnline = async () => {
  try {
    const count = await redis.get('online');
    return count || '0';
  } catch (error) {
    logger.error('Failed to get online count:', error);
    return '0';
  }
};

const addToWaitingList = async (gender, country, socketId) => {
  const key = `${gender}:${country}`;
  try {
    await redis.zAdd(key, { score: Date.now(), value: socketId });
  } catch (error) {
    logger.error(`Failed to add ${socketId} to waiting list ${key}:`, error);
  }
};

const getFirstWaitingUser = async (gender, country) => {
  const key = `${gender}:${country}`;
  try {
    const result = await redis.zRange(key, 0, 0);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(`Failed to get first waiting user from ${key}:`, error);
    return null;
  }
};

const removeFromWaitingList = async (gender, country, socketId) => {
  const key = `${gender}:${country}`;
  try {
    await redis.zRem(key, socketId);
  } catch (error) {
    logger.error(`Failed to remove ${socketId} from ${key}:`, error);
  }
};

const saveRoom = async (roomId, p1Id, p2Id) => {
  const roomData = { p1: p1Id };
  if (p2Id !== null) {
    roomData.p2 = p2Id;
    roomData.isAvailable = 'false';
  } else {
    roomData.isAvailable = 'true';
  }
  try {
    await redis.hSet(`room:${roomId}`, roomData);
    await redis.expire(`room:${roomId}`, 3600);
  } catch (error) {
    logger.error(`Failed to save room ${roomId}:`, error);
    throw error;
  }
};

const getRoom = async (roomId) => {
  try {
    const roomData = await redis.hGetAll(`room:${roomId}`);
    return roomData;
  } catch (error) {
    logger.error(`Failed to get room ${roomId}:`, error);
    return null;
  }
};

const deleteRoom = async (roomId) => {
  try {
    await redis.del(`room:${roomId}`);
  } catch (error) {
    logger.error(`Failed to delete room ${roomId}:`, error);
  }
};

module.exports = {
  redis,
  incrementOnline,
  decrementOnline,
  getOnline,
  addToWaitingList,
  getFirstWaitingUser,
  removeFromWaitingList,
  saveRoom,
  getRoom,
  deleteRoom,
};