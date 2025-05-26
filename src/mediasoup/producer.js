const logger = require('../config/logger');
const { transports } = require('./transport');

/**
 * @type {Map<string, { producer: mediasoup.types.Producer, roomId: string, transportId: string }>}
 */
const producers = new Map();

const createProducer = async (transportId, kind, rtpParameters) => {
  try {
    const transportData = transports.get(transportId);
    if (!transportData) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const producer = await transportData.transport.produce({
      kind,
      rtpParameters,
    });

    const producerId = producer.id;
    producers.set(producerId, {
      producer,
      roomId: transportData.roomId,
      transportId,
    });

    logger.info(`Producer created for room ${transportData.roomId}`);

    return {
      id: producer.id,
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
    };
  } catch (error) {
    logger.error(`Failed to create producer for transport ${transportId}:`, error);
    throw error;
  }
};

const closeProducer = async (producerId) => {
  const producerData = producers.get(producerId);
  if (producerData) {
    await producerData.producer.close();
    producers.delete(producerId);
    logger.info(`Producer ${producerId} closed`);
  }
};

module.exports = {
  createProducer,
  closeProducer,
  producers,
};
