const { getRouter } = require('./router');
const logger = require('../config/logger');
const { transports } = require('./transport');

/**
 * @type {Map<string, { consumer: mediasoup.types.Consumer, roomId: string, transportId: string, producerId: string }>}
 */
const consumers = new Map();

const createConsumer = async (transportId, producerId, rtpCapabilities) => {
  try {
    const transportData = transports.get(transportId);
    if (!transportData) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const router = getRouter(transportData.roomId);
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume this producer');
    }

    const consumer = await transportData.transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    const consumerId = consumer.id;
    consumers.set(consumerId, {
      consumer,
      roomId: transportData.roomId,
      transportId,
      producerId,
    });

    logger.info(`Consumer created for room ${transportData.roomId}`);

    return {
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      producerId: consumer.producerId,
    };
  } catch (error) {
    logger.error(`Failed to create consumer for transport ${transportId}:`, error);
    throw error;
  }
};

const resumeConsumer = async (consumerId) => {
  const consumerData = consumers.get(consumerId);
  if (consumerData) {
    await consumerData.consumer.resume();
    logger.info(`Consumer ${consumerId} resumed`);
  }
};

const closeConsumer = async (consumerId) => {
  const consumerData = consumers.get(consumerId);
  if (consumerData) {
    await consumerData.consumer.close();
    consumers.delete(consumerId);
    logger.info(`Consumer ${consumerId} closed`);
  }
};

module.exports = {
  createConsumer,
  resumeConsumer,
  closeConsumer,
  consumers,
};
