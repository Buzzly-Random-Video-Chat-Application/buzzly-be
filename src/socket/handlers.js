const { v4: uuidv4 } = require('uuid');
const {
  addToWaitingList,
  getFirstWaitingUser,
  removeFromWaitingList,
  saveRandomChatRoom,
  getRandomChatRoom,
  deleteRandomChatRoom,
  redis,
} = require('../config/redis');
const logger = require('../config/logger');
const { connectionService } = require('../services');
const { Connection } = require('../models');

const { getRouter, closeRouter, createRouter } = require('../mediasoup/router');
const { createWebRtcTransport, connectTransport, closeTransport } = require('../mediasoup/transport');
const { createProducer, closeProducer } = require('../mediasoup/producer');
const { createConsumer, resumeConsumer, closeConsumer } = require('../mediasoup/consumer');

const { producers } = require('../mediasoup/producer');

async function handleRandomChatStart(selectedGender, selectedCountry, socket, cb, io) {
  const userId = socket.handshake.query.userId;

  if (!selectedGender || !selectedCountry) {
    socket.emit('random-chat:error', 'Missing gender or country information');
    logger.error(`Missing selectedGender or selectedCountry for socket ${socket.id}`);
    cb(null);
    return;
  }

  let waitingSocketId = await getFirstWaitingUser(selectedGender, selectedCountry);

  if (waitingSocketId) {
    const waitingSocket = io.sockets.sockets.get(waitingSocketId);
    if (!waitingSocket || !waitingSocket.connected) {
      await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);
      return handleRandomChatStart(selectedGender, selectedCountry, socket, cb, io);
    }

    const rooms = await redis.keys('room:*');
    let existingRoomId = null;
    for (const roomKey of rooms) {
      const room = await getRandomChatRoom(roomKey.split(':')[1]);
      if (room && room.p1 === waitingSocketId && room.isAvailable === 'true') {
        existingRoomId = roomKey.split(':')[1];
        break;
      }
    }

    if (existingRoomId) {
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);
        await saveRandomChatRoom(existingRoomId, waitingSocketId, socket.id, {
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
        });

        // Tạo router mediasoup nếu chưa có
        try {
          await createRouter(existingRoomId);
        } catch (e) {
          logger.warn('Router already exists or error:', e);
        }

        // Kiểm tra xem Connection đã tồn tại chưa
        const existingConnection = await Connection.findOne({ roomId: existingRoomId });
        if (existingConnection) {
          await connectionService.updateConnection(existingRoomId, {
            p1UserId: waitingSocket.handshake.query.userId,
            p2UserId: userId,
            isLive: true,
          });
        } else {
          await connectionService.createConnection({
            roomId: existingRoomId,
            p1UserId: waitingSocket.handshake.query.userId,
            p2UserId: userId,
            isLive: true,
          });
        }

        socket.join(existingRoomId);
        logger.info(`P1 (${waitingSocketId}) paired with P2 (${socket.id}) in room ${existingRoomId}`);

        io.to(waitingSocketId).emit('random-chat:peer-joined', {
          socketId: socket.id,
          userId,
        });
        socket.emit('random-chat:peer-joined', {
          socketId: waitingSocketId,
          userId: waitingSocket.handshake.query.userId,
        });
        socket.emit('random-chat:roomid', existingRoomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${existingRoomId}`);
      } catch (error) {
        socket.emit('random-chat:error', 'Failed to join room');
        logger.error(`Error joining room ${existingRoomId}:`, error);
      }
    } else {
      const roomId = uuidv4();
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);
        await saveRandomChatRoom(roomId, waitingSocketId, socket.id, {
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
        });
        await connectionService.createConnection({
          roomId,
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
          isLive: true,
        });
        // Tạo router mediasoup cho room mới
        try {
          await createRouter(roomId);
        } catch (e) {
          logger.warn('Router already exists or error:', e);
        }

        socket.join(roomId);
        io.to(waitingSocketId).emit('random-chat:peer-joined', {
          socketId: socket.id,
          userId,
        });
        socket.emit('random-chat:peer-joined', {
          socketId: waitingSocketId,
          userId: waitingSocket.handshake.query.userId,
        });
        socket.emit('random-chat:roomid', roomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${roomId}`);
      } catch (error) {
        socket.emit('random-chat:error', 'Failed to create room');
        logger.error(`Error creating room ${roomId}:`, error);
      }
    }
  } else {
    const roomId = uuidv4();
    try {
      await saveRandomChatRoom(roomId, socket.id, null, { p1UserId: userId });
      await addToWaitingList(selectedGender, selectedCountry, socket.id);
      socket.join(roomId);
      socket.emit('random-chat:roomid', roomId);
      cb('p1');
      logger.info(`Created waiting room ${roomId} for ${userId || 'anonymous'}`);
      // Tạo router mediasoup cho phòng chờ
      try {
        await createRouter(roomId);
      } catch (e) {
        logger.warn('Router already exists or error:', e);
      }
    } catch (error) {
      socket.emit('random-chat:error', 'Failed to create waiting room');
      logger.error(`Error creating waiting room ${roomId}:`, error);
    }
  }
}

async function handleRandomChatDisconnect(disconnectedId, io) {
  const waitingKeys = await redis.keys('*:*');
  for (const key of waitingKeys) {
    if (key.includes(':') && !key.startsWith('room:')) {
      const [gender, country] = key.split(':');
      await removeFromWaitingList(gender, country, disconnectedId);
    }
  }

  const rooms = await redis.keys('room:*');
  for (const roomKey of rooms) {
    const room = await getRandomChatRoom(roomKey.split(':')[1]);
    if (!room) continue;
    const roomId = roomKey.split(':')[1];
    let shouldDeleteRouter = false;
    if (room.p1 === disconnectedId) {
      if (room.p2) {
        const p2Socket = io.sockets.sockets.get(room.p2);
        if (p2Socket && p2Socket.connected) {
          io.to(room.p2).emit('random-chat:disconnected');
          await saveRandomChatRoom(roomId, room.p2, null, { p1UserId: room.p2UserId, p2UserId: null });
          await connectionService.updateConnection(roomId, { isLive: false });
        } else {
          await deleteRandomChatRoom(roomId);
          await connectionService.updateConnection(roomId, { isLive: false });
          shouldDeleteRouter = true;
        }
      } else {
        await deleteRandomChatRoom(roomId);
        shouldDeleteRouter = true;
      }
      // Cleanup mediasoup router if needed
      if (shouldDeleteRouter) {
        try {
          await closeRouter(roomId);
        } catch (e) {
          logger.warn('Router cleanup error:', e);
        }
      }
      break;
    } else if (room.p2 === disconnectedId) {
      const p1Socket = io.sockets.sockets.get(room.p1);
      if (p1Socket && p1Socket.connected) {
        io.to(room.p1).emit('random-chat:disconnected');
        await saveRandomChatRoom(roomId, room.p1, null, { p1UserId: room.p1UserId, p2UserId: null });
        await connectionService.updateConnection(roomId, { isLive: false });
      } else {
        await deleteRandomChatRoom(roomId);
        await connectionService.updateConnection(roomId, { isLive: false });
        shouldDeleteRouter = true;
      }
      // Cleanup mediasoup router if needed
      if (shouldDeleteRouter) {
        try {
          await closeRouter(roomId);
        } catch (e) {
          logger.warn('Router cleanup error:', e);
        }
      }
      break;
    }
  }
}

function handleRandomChatSendMessage(input, type, roomId, socket, io) {
  socket.to(roomId).emit('random-chat:get-message', input, type);
}

async function handleRandomChatEndChat(roomId, socket, io) {
  const room = await getRandomChatRoom(roomId);
  if (!room) {
    socket.emit('random-chat:error', 'Room not found');
    return;
  }
  io.to(roomId).emit('random-chat:end-chat');
  await connectionService.updateConnection(roomId, { isLive: false });
  await deleteRandomChatRoom(roomId);
  // Cleanup mediasoup router
  try {
    await closeRouter(roomId);
  } catch (e) {
    logger.warn('Router cleanup error:', e);
  }
  logger.info(`Room ${roomId} ended by ${socket.id}`);
}

async function handleRandomChatNextChat(roomId, socket, io) {
  // Kiểm tra xem phòng đã được xử lý next chat chưa
  const processedKey = `room:nextchat:${roomId}`;
  const isRoomProcessed = await redis.get(processedKey);
  if (isRoomProcessed) {
    logger.info(`Room ${roomId} already processed for next chat, skipping`);
    return;
  }

  // Đánh dấu phòng đang được xử lý
  await redis.set(processedKey, 'true');
  await redis.expire(processedKey, 60);

  try {
    const room = await getRandomChatRoom(roomId);
    if (!room) {
      socket.emit('random-chat:error', 'Room not found');
      return;
    }

    const p1SocketId = room.p1;
    const p2SocketId = room.p2;
    const p1UserId = room.p1UserId;
    const p2UserId = room.p2UserId;

    // Xóa phòng hiện tại
    await deleteRandomChatRoom(roomId);
    const updatedConnection = await connectionService.updateConnection(roomId, { isLive: false });
    if (!updatedConnection) {
      logger.warn(`No connection found for room ${roomId}`);
    }
    io.to(roomId).emit('random-chat:next-chat');
    logger.info(`Room ${roomId} ended for next chat by ${socket.id}`);

    // Tạo phòng mới và thêm vào danh sách chờ cho p1 (nếu còn kết nối)
    if (p1SocketId) {
      const p1Socket = io.sockets.sockets.get(p1SocketId);
      if (p1Socket && p1Socket.connected) {
        const selectedGender = p1Socket.handshake.query.selectedGender;
        const selectedCountry = p1Socket.handshake.query.selectedCountry;
        if (!selectedGender || !selectedCountry) {
          p1Socket.emit('random-chat:error', 'Missing gender or country information');
          logger.error(`Missing selectedGender or selectedCountry for p1 (${p1SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveRandomChatRoom(newRoomId, p1SocketId, null, { p1UserId });
            await addToWaitingList(selectedGender, selectedCountry, p1SocketId);
            p1Socket.join(newRoomId);
            p1Socket.emit('random-chat:roomid', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p1 (${p1SocketId})`);
          } catch (error) {
            p1Socket.emit('random-chat:error', 'Failed to create waiting room');
            logger.error(`Error creating waiting room ${newRoomId} for p1:`, error);
          }
        }
      }
    }

    // Tạo phòng mới và thêm vào danh sách chờ cho p2 (nếu còn kết nối)
    if (p2SocketId) {
      const p2Socket = io.sockets.sockets.get(p2SocketId);
      if (p2Socket && p2Socket.connected) {
        const selectedGender = p2Socket.handshake.query.selectedGender;
        const selectedCountry = p2Socket.handshake.query.selectedCountry;
        if (!selectedGender || !selectedCountry) {
          p2Socket.emit('random-chat:error', 'Missing gender or country information');
          logger.error(`Missing selectedGender or selectedCountry for p2 (${p2SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveRandomChatRoom(newRoomId, p2SocketId, null, { p1UserId: p2UserId });
            await addToWaitingList(selectedGender, selectedCountry, p2SocketId);
            p2Socket.join(newRoomId);
            p2Socket.emit('random-chat:roomid', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p2 (${p2SocketId})`);
          } catch (error) {
            p2Socket.emit('random-chat:error', 'Failed to create waiting room');
            logger.error(`Error creating waiting room ${newRoomId} for p2:`, error);
          }
        }
      }
    }
  } catch (error) {
    socket.emit('random-chat:error', 'Failed to process next chat');
    logger.error(`Error in handleRandomChatNextChat for room ${roomId}:`, error);
  }
}

const handleGetRouterRtpCapabilities = async (socket, roomId) => {
  try {
    const router = getRouter(roomId);
    const rtpCapabilities = router.rtpCapabilities;
    socket.emit('mediasoup:router-rtp-capabilities', { rtpCapabilities });
  } catch (error) {
    logger.error(`Failed to get router RTP capabilities for room ${roomId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to get router capabilities' });
  }
};

const handleCreateWebRtcTransport = async (socket, { roomId, direction }, callback) => {
  try {
    const transport = await createWebRtcTransport(roomId, direction);
    callback({ transport });

    socket.emit('mediasoup:transport-created', { transport });
  } catch (error) {
    logger.error(`Failed to create WebRTC transport for room ${roomId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to create transport' });
  }
};

const handleConnectTransport = async (socket, { transportId, dtlsParameters }) => {
  try {
    await connectTransport(transportId, dtlsParameters);
    socket.emit('mediasoup:transport-connected', { transportId });
  } catch (error) {
    logger.error(`Failed to connect transport ${transportId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to connect transport' });
  }
};

const handleProduce = async (socket, { transportId, kind, rtpParameters, socketId }, callback) => {
  try {
    const producer = await createProducer(transportId, kind, rtpParameters);
    callback({ producer });
    socket.emit('mediasoup:producer-created', { producer });
    socket.to(socketId).emit('mediasoup:new-producer', { producerId: producer.id });
  } catch (error) {
    logger.error(`Failed to create producer for transport ${transportId} 1:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to create producer' });
  }
};

const handleConsume = async (socket, { transportId, producerId, rtpCapabilities }, callback) => {
  try {
    const consumer = await createConsumer(transportId, producerId, rtpCapabilities);
    callback({ consumer });
    await resumeConsumer(consumer.id);
    socket.emit('mediasoup:consumer-created', { consumer });
  } catch (error) {
    logger.error(`Failed to create consumer for transport ${transportId}:`, error);
    logger.info(`Producers`, producers);
    socket.emit('mediasoup:error', { message: 'Failed to create consumer' });
  }
};

const handleCloseTransport = async (socket, { transportId }) => {
  try {
    await closeTransport(transportId);
    socket.emit('mediasoup:transport-closed', { transportId });
  } catch (error) {
    logger.error(`Failed to close transport ${transportId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to close transport' });
  }
};

const handleCloseProducer = async (socket, { producerId }) => {
  try {
    await closeProducer(producerId);
    socket.emit('mediasoup:producer-closed', { producerId });
  } catch (error) {
    logger.error(`Failed to close producer ${producerId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to close producer' });
  }
};

const handleCloseConsumer = async (socket, { consumerId }) => {
  try {
    await closeConsumer(consumerId);
    socket.emit('mediasoup:consumer-closed', { consumerId });
  } catch (error) {
    logger.error(`Failed to close consumer ${consumerId}:`, error);
    socket.emit('mediasoup:error', { message: 'Failed to close consumer' });
  }
};

module.exports = {
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
};
