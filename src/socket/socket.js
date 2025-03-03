const { handelStart, handelDisconnect, getType } = require('./lib');

/**
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 */
const setupSocketIO = (io) => {
  let online = 0;
  const roomArr = [];

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-plusplus
    online++;
    io.emit('online', online); // Broadcast user count

    // on start
    socket.on('start', (cb) => {
      handelStart(roomArr, socket, cb, io); // Call the pairing function
    });

    // On disconnectionemit("start",
    socket.on('disconnect', () => {
      // eslint-disable-next-line no-plusplus
      online--;
      io.emit('online', online);
      handelDisconnect(socket.id, roomArr, io); // Handle the disconnection
    });

    /// ------- logic for webrtc connection ------

    // on ice send
    socket.on('ice:send', ({ candidate, to }) => {
      const type = getType(socket.id, roomArr); // Get the user's role (p1 or p2)
      if (type) {
        if (type.type === 'p1' && type.p2id === to) {
          io.to(to).emit('ice:reply', { candidate, from: socket.id });
        } else if (type.type === 'p2' && type.p1id === to) {
          io.to(to).emit('ice:reply', { candidate, from: socket.id });
        }
      }
    });

    // on sdp send
    socket.on('sdp:send', ({ sdp, to }) => {
      const type = getType(socket.id, roomArr);
      if (type) {
        if (type.type === 'p1' && type.p2id === to) {
          io.to(to).emit('sdp:reply', { sdp, from: socket.id });
        }
        if (type.type === 'p2' && type.p1id === to) {
          io.to(to).emit('sdp:reply', { sdp, from: socket.id });
        }
      }
    });

    /// --------- Messages -----------

    // send message
    socket.on('send-message', (input, type, roomid) => {
      //  Format message to show sender
      const sender = type === 'p1' ? 'You: ' : 'Stranger: ';
      socket.to(roomid).emit('get-message', input, sender); // Send to the room, not just the sender.
    });
  });
};

module.exports = setupSocketIO;
