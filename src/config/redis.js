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
    connectTimeout: 10000,
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

const increVideoChatOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during increase video-chat online');
    return;
  }
  try {
    await redis.incr('random-chat-online');
  } catch (error) {
    logger.error('Failed to increment online count:', error);
  }
};

const decreVideoChatOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during decrease video-chat online');
    return;
  }
  try {
    await redis.decr('random-chat-online');
  } catch (error) {
    logger.error('Failed to decrement online count:', error);
  }
};

const getVideoChatOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during get random-video online count');
    return 0;
  }
  try {
    const count = await redis.get('random-chat-online');
    return count || 0;
  } catch (error) {
    logger.error('Failed to get online count:', error);
    return 0;
  }
};

const addToWaitingList = async (gender, country, socketId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during add user to waiting list');
    return;
  }
  const key = `${gender}:${country}`;
  try {
    await redis.zAdd(key, { score: Date.now(), value: socketId });
  } catch (error) {
    logger.error(`Failed to add ${socketId} to waiting list ${key}:`, error);
  }
};

const getFirstWaitingUser = async (gender, country) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during get first waiting user');
    return null;
  }
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
  if (!redis.isOpen) {
    logger.error('Redis client is closed during remve user from waiting list');
    return;
  }
  const key = `${gender}:${country}`;
  try {
    await redis.zRem(key, socketId);
  } catch (error) {
    logger.error(`Failed to remove ${socketId} from ${key}:`, error);
  }
};

const saveRandomChatRoom = async (roomId, p1Id, p2Id, userIds = {}) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during save room');
    throw new Error('Redis client is closed');
  }
  const { p1UserId, p2UserId } = userIds;
  const roomData = {
    p1: p1Id || '',
    p1UserId: p1UserId || '',
    p2: p2Id || '',
    p2UserId: p2UserId || '',
    isAvailable: p2Id ? 'false' : 'true',
  };
  try {
    await redis.hSet(`room:${roomId}`, roomData);
    await redis.expire(`room:${roomId}`, 3600);
  } catch (error) {
    logger.error(`Failed to save room ${roomId}:`, error);
    throw error;
  }
};

const getRandomChatRoom = async (roomId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during get room');
    return null;
  }
  try {
    const roomData = await redis.hGetAll(`room:${roomId}`);
    return roomData;
  } catch (error) {
    logger.error(`Failed to get room ${roomId}:`, error);
    return null;
  }
};

const deleteRandomChatRoom = async (roomId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during delete room');
    return;
  }
  try {
    await redis.del(`room:${roomId}`);
  } catch (error) {
    logger.error(`Failed to delete room ${roomId}:`, error);
  }
};

module.exports = {
  redis,
  increVideoChatOnline,
  decreVideoChatOnline,
  getVideoChatOnline,
  addToWaitingList,
  getFirstWaitingUser,
  removeFromWaitingList,
  saveRandomChatRoom,
  getRandomChatRoom,
  deleteRandomChatRoom,
};
