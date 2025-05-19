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

const incrementOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during incrementOnline');
    return;
  }
  try {
    await redis.incr('online');
  } catch (error) {
    logger.error('Failed to increment online count:', error);
  }
};

const decrementOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during decrementOnline');
    return;
  }
  try {
    await redis.decr('online');
  } catch (error) {
    logger.error('Failed to decrement online count:', error);
  }
};

const getOnline = async () => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during getOnline');
    return 0;
  }
  try {
    const count = await redis.get('online');
    return count || 0;
  } catch (error) {
    logger.error('Failed to get online count:', error);
    return 0;
  }
};

const addToWaitingList = async (gender, country, socketId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during addToWaitingList');
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
    logger.error('Redis client is closed during getFirstWaitingUser');
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
    logger.error('Redis client is closed during removeFromWaitingList');
    return;
  }
  const key = `${gender}:${country}`;
  try {
    await redis.zRem(key, socketId);
  } catch (error) {
    logger.error(`Failed to remove ${socketId} from ${key}:`, error);
  }
};

const saveRcRoom = async (roomId, p1Id, p2Id, userIds = {}) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during saveRoom');
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

const getRcRoom = async (roomId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during getRoom');
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

const deleteRcRoom = async (roomId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during deleteRoom');
    return;
  }
  try {
    await redis.del(`room:${roomId}`);
  } catch (error) {
    logger.error(`Failed to delete room ${roomId}:`, error);
  }
};

const saveLtRoom = async (livestreamId, host, guests = []) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during saveLtRoom');
    throw new Error('Redis client is closed');
  }
  if (!host.hostUserId || !host.hostSocketId) {
    logger.error('Invalid host data: hostUserId and hostSocketId are required');
    throw new Error('Invalid host data');
  }
  const roomData = {
    livestreamId,
    hostUserId: host.hostUserId,
    hostSocketId: host.hostSocketId,
  };
  const guestSetKey = `livestream:${livestreamId}:guests`;
  try {
    // Lưu thông tin livestream và host
    await redis.hSet(`livestream:${livestreamId}`, roomData);
    await redis.expire(`livestream:${livestreamId}`, 86400);
    // Lưu danh sách guests vào Set
    if (guests.length > 0) {
      const guestEntries = guests.map((g) => `${g.guestUserId}:${g.guestSocketId}`);
      await redis.sAdd(guestSetKey, guestEntries);
    }
    await redis.expire(guestSetKey, 86400);
  } catch (error) {
    logger.error(`Failed to save livestream room ${livestreamId}:`, error);
    throw error;
  }
};

const getLtRoom = async (livestreamId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during getLtRoom');
    return null;
  }
  const guestSetKey = `livestream:${livestreamId}:guests`;
  try {
    const roomData = await redis.hGetAll(`livestream:${livestreamId}`);
    if (Object.keys(roomData).length === 0) return null;
    // Lấy danh sách guests từ Set
    const guestEntries = await redis.sMembers(guestSetKey);
    const guests = guestEntries.map((entry) => {
      const [guestUserId, guestSocketId] = entry.split(':');
      return { guestUserId, guestSocketId };
    });
    roomData.guests = guests;
    return roomData;
  } catch (error) {
    logger.error(`Failed to get livestream room ${livestreamId}:`, error);
    return null;
  }
};

const addGuestToLtRoom = async (livestreamId, guest) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during addGuestToLtRoom');
    return;
  }
  if (!guest.guestUserId || !guest.guestSocketId) {
    logger.error('Invalid guest data: guestUserId and guestSocketId are required');
    return;
  }
  const guestSetKey = `livestream:${livestreamId}:guests`;
  const guestEntry = `${guest.guestUserId}:${guest.guestSocketId}`;
  try {
    const roomData = await redis.hGetAll(`livestream:${livestreamId}`);
    if (Object.keys(roomData).length === 0) {
      throw new Error(`Livestream room ${livestreamId} not found`);
    }
    // Thêm guest vào Set (Set tự động tránh trùng lặp)
    await redis.sAdd(guestSetKey, guestEntry);
    await redis.expire(guestSetKey, 86400);
    logger.info(`Added guest ${guestEntry} to livestream ${livestreamId}`);
  } catch (error) {
    logger.error(`Failed to add guest to livestream room ${livestreamId}:`, error);
  }
};

const removeGuestFromLtRoom = async (livestreamId, guestSocketId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during removeGuestFromLtRoom');
    return;
  }
  const guestSetKey = `livestream:${livestreamId}:guests`;
  try {
    const roomData = await redis.hGetAll(`livestream:${livestreamId}`);
    if (Object.keys(roomData).length === 0) {
      throw new Error(`Livestream room ${livestreamId} not found`);
    }
    // Tìm guest entry dựa trên guestSocketId
    const guestEntries = await redis.sMembers(guestSetKey);
    const guestEntry = guestEntries.find((entry) => entry.split(':')[1] === guestSocketId);
    if (guestEntry) {
      await redis.sRem(guestSetKey, guestEntry);
      logger.info(`Removed guest ${guestEntry} from livestream ${livestreamId}`);
    }
  } catch (error) {
    logger.error(`Failed to remove guest from livestream room ${livestreamId}:`, error);
  }
};

const deleteLtRoom = async (livestreamId) => {
  if (!redis.isOpen) {
    logger.error('Redis client is closed during deleteLtRoom');
    return;
  }
  const guestSetKey = `livestream:${livestreamId}:guests`;
  try {
    await redis.del(`livestream:${livestreamId}`);
    await redis.del(guestSetKey);
    logger.info(`Deleted livestream room ${livestreamId}`);
  } catch (error) {
    logger.error(`Failed to delete livestream room ${livestreamId}:`, error);
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
  saveRcRoom,
  getRcRoom,
  deleteRcRoom,

  saveLtRoom,
  getLtRoom,
  addGuestToLtRoom,
  removeGuestFromLtRoom,
  deleteLtRoom,
};
