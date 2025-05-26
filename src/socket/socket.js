const {
  handleRandomChatStart,
  handleRandomChatDisconnect,
  handleRandomChatSendMessage,
  handleRandomChatEndChat,
  handleRandomChatNextChat,

  handleGetRouterRtpCapabilities,
  handleCreateWebRtcTransport,
  handleConnectTransport,
  handleProduce,
  handleConsume,
  handleCloseTransport,
  handleCloseProducer,
  handleCloseConsumer,
} = require('./handlers');
const { increVideoChatOnline, decreVideoChatOnline, getVideoChatOnline } = require('../config/redis');
const logger = require('../config/logger');
const { createRouter } = require('../mediasoup/router');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    increVideoChatOnline()
      .then(() => getVideoChatOnline())
      .then((count) => io.emit('random-chat-online', count))
      .catch((error) => logger.error('Error updating online count:', error));

    socket.on('random-chat:start', ({ selectedGender, selectedCountry }, cb) => {
      socket.data.type = 'random-chat';
      handleRandomChatStart(selectedGender, selectedCountry, socket, cb, io);
    });

    socket.on('random-chat:send-message', (input, type, roomId) => {
      handleRandomChatSendMessage(input, type, roomId, socket, io);
    });

    socket.on('random-chat:end-chat', (roomId) => {
      handleRandomChatEndChat(roomId, socket, io);
    });

    socket.on('random-chat:next-chat', (roomId) => {
      handleRandomChatNextChat(roomId, socket, io);
    });

    // Mediasoup event handlers
    socket.on('mediasoup:get-router-rtp-capabilities', (roomId) => {
      handleGetRouterRtpCapabilities(socket, roomId);
    });

    socket.on('mediasoup:create-transport', (data, callback) => {
      handleCreateWebRtcTransport(socket, data, callback);
    });

    socket.on('mediasoup:connect-transport', (data) => {
      handleConnectTransport(socket, data);
    });

    socket.on('mediasoup:produce', (data, callback) => {
      handleProduce(socket, data, callback);
    });

    socket.on('mediasoup:consume', (data, callback) => {
      handleConsume(socket, data, callback);
    });

    socket.on('mediasoup:close-transport', (data) => {
      handleCloseTransport(socket, data);
    });

    socket.on('mediasoup:close-producer', (data) => {
      handleCloseProducer(socket, data);
    });

    socket.on('mediasoup:close-consumer', (data) => {
      handleCloseConsumer(socket, data);
    });

    // Room management
    socket.on('random-chat:join-room', async (roomId) => {
      try {
        // Create router if it doesn't exist
        await createRouter(roomId);

        // Join socket.io room
        socket.join(roomId);
        logger.info(`Client ${socket.id} joined room ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', { userId: socket.id });
      } catch (error) {
        logger.error(`Failed to join room ${roomId}:`, error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('random-chat:leave-room', (roomId) => {
      socket.leave(roomId);
      logger.info(`Client ${socket.id} left room ${roomId}`);
      socket.to(roomId).emit('user-left', { userId: socket.id });
    });

    socket.on('disconnect', async () => {
      await decreVideoChatOnline()
        .then(() => getVideoChatOnline())
        .then((count) => io.emit('random-chat-online', count))
        .catch((error) => logger.error('Error updating online count:', error));

      if (socket.data.type === 'random-chat') {
        await handleRandomChatDisconnect(socket.id, io);
      }

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
