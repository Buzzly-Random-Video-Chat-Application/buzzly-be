const config = require('./config');
const { getRouter } = require('./router');
const logger = require('../config/logger');

/**
 * @type {Map<string, { transport: mediasoup.types.Transport, roomId: string, direction: string }>}
 */
const transports = new Map();

const createWebRtcTransport = async (roomId, direction = 'send') => {
  try {
    const router = getRouter(roomId);
    const transport = await router.createWebRtcTransport(config.webRtcTransport);
    
    const transportId = transport.id;
    transports.set(transportId, {
      transport,
      roomId,
      direction,
    });

    logger.info(`WebRTC transport created for room ${roomId} (${direction})`);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  } catch (error) {
    logger.error(`Failed to create WebRTC transport for room ${roomId}:`, error);
    throw error;
  }
};

const connectTransport = async (transportId, dtlsParameters) => {
  try {
    const transportData = transports.get(transportId);
    if (!transportData) {
      throw new Error(`Transport ${transportId} not found`);
    }

    await transportData.transport.connect({ dtlsParameters });
    logger.info(`Transport ${transportId} connected`);
  } catch (error) {
    logger.error(`Failed to connect transport ${transportId}:`, error);
    throw error;
  }
};

const closeTransport = async (transportId) => {
  const transportData = transports.get(transportId);
  if (transportData) {
    await transportData.transport.close();
    transports.delete(transportId);
    logger.info(`Transport ${transportId} closed`);
  }
};

module.exports = {
  createWebRtcTransport,
  connectTransport,
  closeTransport,
  transports,
}; 