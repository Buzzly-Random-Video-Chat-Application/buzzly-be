const mediasoup = require('mediasoup');
const config = require('./config');
const logger = require('../config/logger');
/**
 * @type {mediasoup.types.Worker | null}
 */
let worker = null;

const createWorker = async () => {
  try {
    worker = await mediasoup.createWorker(config.worker);
    logger.info(`Mediasoup worker created with pid: ${worker.pid}`);

    worker.on('died', () => {
      logger.error('Mediasoup worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });

    return worker;
  } catch (error) {
    logger.error('Failed to create mediasoup worker:', error);
    throw error;
  }
};

const getWorker = () => {
  if (!worker) {
    throw new Error('Mediasoup worker not initialized');
  }
  return worker;
};

const closeWorker = async () => {
  if (worker) {
    await worker.close();
    worker = null;
  }
};

module.exports = {
  createWorker,
  getWorker,
  closeWorker,
  worker,
};
