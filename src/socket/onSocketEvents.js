const {
  handleVideoChatStart,
  handleVideoChatDisconnect,
  handleVideoChatIceSend,
  handleVideoChatSdpSend,
  handleVideoChatSendMessage,
  handleVideoChatEndChat,
  handleVideoChatNextChat,

  handleStartLivestream,
  handleJoinLivestream,
  handleLivestreamSendMessage,
  handleHostIceSend,
  handleGuestIceSend,
  handleHostSdpSend,
  handleGuestSdpSend,
  handleEndLivestream,
  handleNextLivestream,
  handleLeaveLivestream,
  handleLivestreamDisconnect,
} = require('./emitSocketEvents');
const { incrVideoChatOnline, decrVideoChatOnline, getVideoChatOnline, incrLivestreamOnline, decrLivestreamOnline, getLivestreamOnline } = require('../config/redis');
const logger = require('../config/logger');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    // Video Chat
    socket.on('video-chat:connect', () => {
      incrVideoChatOnline()
      .then(() => getVideoChatOnline())
      .then((count) => io.emit('video-chat-online', count))
      .catch((error) => logger.error('Error updating video chat online count:', error));
    });

    socket.on('video-chat:start', ({ selectedGender, selectedCountry }, cb) => {
      socket.data.type = 'video-chat';
      handleVideoChatStart(selectedGender, selectedCountry, socket, cb, io);
    });

    socket.on('video-chat:ice:send', ({ candidate, to }) => {
      handleVideoChatIceSend({ candidate, to }, socket, io);
    });

    socket.on('video-chat:sdp:send', ({ sdp, to }) => {
      handleVideoChatSdpSend({ sdp, to }, socket, io);
    });

    socket.on('video-chat:send-message', (message, userType, roomId) => {
      logger.info('Sending message:', message, userType, roomId);
      handleVideoChatSendMessage(message, userType, roomId, socket);
    });

    socket.on('video-chat:end-chat', (roomId) => {
      handleVideoChatEndChat(roomId, socket, io);
    });

    socket.on('video-chat:next-chat', (roomId) => {
      handleVideoChatNextChat(roomId, socket, io);
    });

    // Livestream
    socket.on('livestream:connect', () => {
      incrLivestreamOnline()
      .then(() => getLivestreamOnline())
      .then((count) => io.emit('livestream-online', count))
      .catch((error) => logger.error('Error updating livestream online count:', error));
    });

    socket.on('livestream:start', ({ livestreamName, livestreamGreeting, livestreamAnnouncement }, cb) => {
      handleStartLivestream({ livestreamName, livestreamGreeting, livestreamAnnouncement }, socket, cb, io);
    });

    socket.on('host:ice:send', ({ livestreamId, candidate, to }) => {
      handleHostIceSend({ livestreamId, candidate, to }, socket, io);
    });

    socket.on('host:sdp:send', ({ livestreamId, sdp, to }) => {
      handleHostSdpSend({ livestreamId, sdp, to }, socket, io);
    });

    socket.on('livestream:end', ({ livestreamId }) => {
      logger.info(`Ending livestream ${livestreamId} by host ${socket.handshake.query.userId}`);
      handleEndLivestream({ livestreamId }, socket, io);
    });

    socket.on('livestream:join', ({ livestreamId }, cb) => {
      handleJoinLivestream({ livestreamId }, socket, cb, io);
    });

    socket.on('guest:ice:send', ({ livestreamId, candidate, to }) => {
      handleGuestIceSend({ livestreamId, candidate, to }, socket, io);
    });

    socket.on('guest:sdp:send', ({ livestreamId, sdp, to }) => {
      handleGuestSdpSend({ livestreamId, sdp, to }, socket, io);
    });

    socket.on('livestream:click-next', ({ livestreamId }) => {
      handleNextLivestream({ livestreamId }, socket, io);
    });

    socket.on('livestream:leave', ({ livestreamId }) => {
      handleLeaveLivestream({ livestreamId }, socket, io);
    });

    socket.on('livestream:send-message', ({ livestreamId, message, type }) => {
      handleLivestreamSendMessage({ livestreamId, message, type }, socket, io);
    });

    socket.on('video-chat:disconnect', async () => {
      await handleVideoChatDisconnect(socket.id, io);
      decrVideoChatOnline()
      .then(() => getVideoChatOnline())
      .then((count) => io.emit('video-chat-online', count))
      .catch((error) => logger.error('Error updating video chat online count:', error));
    });

    socket.on('livestream:disconnect', async () => {
      await handleLivestreamDisconnect(socket.id, socket, io);
      decrLivestreamOnline()
      .then(() => getLivestreamOnline())
      .then((count) => io.emit('livestream-online', count))
      .catch((error) => logger.error('Error updating livestream online count:', error));
    });
  });
};

module.exports = setupSocketIO;
