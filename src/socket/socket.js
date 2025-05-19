const {
  handleRcStart,
  handleRcDisconnect,
  handleRcIceSend,
  handleRcSdpSend,
  handleRcSendMessage,
  handleRcEndChat,
  handleRcNextChat,

  handleStartLivestream,
  handleJoinLivestream,
  handleSendMessage,
  handleHostIceSend,
  handleGuestIceSend,
  handleHostSdpSend,
  handleGuestSdpSend,
  handleEndLivestream,
  handleNextLivestream,
  handleLeaveLivestream,
  handleDisconnect,
} = require('./lib');
const { incrementOnline, decrementOnline, getOnline } = require('../config/redis');
const logger = require('../config/logger');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    incrementOnline()
      .then(() => getOnline())
      .then((count) => io.emit('online', count))
      .catch((error) => logger.error('Error updating online count:', error));

    socket.on('rc_start', ({ selectedGender, selectedCountry }, cb) => {
      socket.data.connectionType = 'rc';
      handleRcStart(selectedGender, selectedCountry, socket, cb, io);
    });

    socket.on('rc_ice:send', ({ candidate, to }) => {
      handleRcIceSend({ candidate, to }, socket, io);
    });

    socket.on('rc_sdp:send', ({ sdp, to }) => {
      handleRcSdpSend({ sdp, to }, socket, io);
    });

    socket.on('rc_send-message', (input, type, roomId) => {
      handleRcSendMessage(input, type, roomId, socket, io);
    });

    socket.on('rc_end-chat', (roomId) => {
      handleRcEndChat(roomId, socket, io);
    });

    socket.on('rc_next-chat', (roomId) => {
      handleRcNextChat(roomId, socket, io);
    });

    socket.on('start:livestream', ({ livestreamName, livestreamGreeting, livestreamAnnouncement }, cb) => {
      handleStartLivestream({ livestreamName, livestreamGreeting, livestreamAnnouncement }, socket, cb, io);
      // emit tương ứng: 'livestream:started'
    });

    socket.on('host:ice:send', ({ livestreamId, candidate, to }) => {
      handleHostIceSend({ livestreamId, candidate, to }, socket, io);
      // emit tương ứng: 'host:ice:reply'
    });

    socket.on('host:sdp:send', ({ livestreamId, sdp, to }) => {
      handleHostSdpSend({ livestreamId, sdp, to }, socket, io);
      // emit tương ứng: 'host:sdp:reply'
    });

    socket.on('end:livestream', ({ livestreamId }) => {
      handleEndLivestream({ livestreamId }, socket, io);
      // emit tương ứng: 'livestream:ended'
    });

    socket.on('join:livestream', ({ livestreamId }, cb) => {
      handleJoinLivestream({ livestreamId }, socket, cb, io);
      // emit tương ứng: 'livestream:joined'
    });

    socket.on('guest:ice:send', ({ livestreamId, candidate, to }) => {
      handleGuestIceSend({ livestreamId, candidate, to }, socket, io);
      // emit tương ứng: 'guest:ice:reply'
    });

    socket.on('guest:sdp:send', ({ livestreamId, sdp, to }) => {
      handleGuestSdpSend({ livestreamId, sdp, to }, socket, io);
      // emit tương ứng: 'guest:sdp:reply'
    });

    socket.on('next:livestream', ({ livestreamId }) => {
      handleNextLivestream({ livestreamId }, socket, io);
      // emit tương ứng: 'livestream:next'
    });

    socket.on('leave:livestream', ({ livestreamId }) => {
      handleLeaveLivestream({ livestreamId }, socket, io);
      // emit tương ứng: 'livestream:left'
    });

    socket.on('send:message', ({ livestreamId, message, type }) => {
      handleSendMessage({ livestreamId, message, type }, socket, io);
      // emit tương ứng: 'message:sent'
    });

    socket.on('disconnect', async () => {
      await decrementOnline()
        .then(() => getOnline())
        .then((count) => io.emit('online', count))
        .catch((error) => logger.error('Error updating online count:', error));

      if (socket.data.connectionType === 'lt') {
        await handleDisconnect(socket.id, socket, io);
      }

      if (socket.data.connectionType === 'rc') {
        await handleRcDisconnect(socket.id, io);
      }

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocketIO;
