const config = require('./config');
const { getWorker } = require('./worker');
const logger = require('../config/logger');

/**
 * @type {Map<string, mediasoup.types.Router>}
 */
const routers = new Map();

const createRouter = async (roomId) => {
  try {
    const worker = getWorker();
    const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
    routers.set(roomId, router);
    router.on('died', () => {
      logger.error(`Router for room ${roomId} died`);
      routers.delete(roomId);
    });
    logger.info(`Router created for room ${roomId}`);
    return router;
  } catch (error) {
    logger.error(`Failed to create router for room ${roomId}:`, error);
    throw error;
  }
};

const getRouter = (roomId) => {
  const router = routers.get(roomId);
  if (!router) {
    throw new Error(`Router not found for room ${roomId}`);
  }
  return router;
};

const closeRouter = async (roomId) => {
  const router = routers.get(roomId);
  if (router) {
    await router.close();
    routers.delete(roomId);
    logger.info(`Router closed for room ${roomId}`);
  }
};

module.exports = {
  createRouter,
  getRouter,
  closeRouter,
  routers,
};
