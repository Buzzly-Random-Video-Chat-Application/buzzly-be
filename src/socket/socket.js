const { handelStart, getType, handelDisconnect } = require('./lib');
const { incrementOnline, decrementOnline, getOnline } = require('../config/redis');
const logger = require('../config/logger');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    incrementOnline()
      .then(() => getOnline())
      .then((count) => io.emit('online', count))
      .catch((error) => logger.error('Error updating online count:', error));

    socket.on('start', ({ selectedGender, selectedCountry }, cb) => {
      handelStart(selectedGender, selectedCountry, socket, cb, io);
    });

    socket.on('disconnect', () => {
      decrementOnline()
        .then(() => getOnline())
        .then((count) => io.emit('online', count))
        .catch((error) => logger.error('Error updating online count:', error));
      
      handelDisconnect(socket.id, io);
      logger.info(`Socket disconnected`);
    });

    socket.on('ice:send', async ({ candidate, to }) => {
      const type = await getType(socket.id);
      if (type && ((type.type === 'p1' && type.p2id === to) || (type.type === 'p2' && type.p1id === to))) {
        const toSocket = io.sockets.sockets.get(to);
        if (toSocket && toSocket.connected) {
          io.to(to).emit('ice:reply', { candidate, from: socket.id });
          setTimeout(() => {
            if (!io.sockets.sockets.get(to)) {
              socket.emit('error', 'Peer unavailable');
            }
          }, 5000);
        } else {
          socket.emit('error', 'Peer disconnected');
        }
      }
    });

    socket.on('sdp:send', async ({ sdp, to }) => {
      const type = await getType(socket.id);
      if (type && ((type.type === 'p1' && type.p2id === to) || (type.type === 'p2' && type.p1id === to))) {
        const toSocket = io.sockets.sockets.get(to);
        if (toSocket && toSocket.connected) {
          io.to(to).emit('sdp:reply', { sdp, from: socket.id });
        } else {
          socket.emit('error', 'Peer disconnected');
        }
      }
    });

    socket.on('send-message', (input, type, roomid) => {
      socket.to(roomid).emit('get-message', input, type);
    });
  });
};

module.exports = setupSocketIO;