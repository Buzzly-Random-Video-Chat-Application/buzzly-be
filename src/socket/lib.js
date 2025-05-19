const { v4: uuidv4 } = require('uuid');
const {
  addToWaitingList,
  getFirstWaitingUser,
  removeFromWaitingList,
  saveRcRoom,
  getRcRoom,
  deleteRcRoom,

  saveLtRoom,
  getLtRoom,
  addGuestToLtRoom,
  removeGuestFromLtRoom,
  deleteLtRoom,
  redis,
} = require('../config/redis');
const logger = require('../config/logger');
const { connectionService, livestreamService } = require('../services');
const { Connection } = require('../models');

async function handleRcStart(selectedGender, selectedCountry, socket, cb, io) {
  const userId = socket.handshake.query.userId;

  if (!selectedGender || !selectedCountry) {
    socket.emit('rc_error', 'Missing gender or country information');
    logger.error(`Missing selectedGender or selectedCountry for socket ${socket.id}`);
    cb(null);
    return;
  }

  let waitingUserId = await getFirstWaitingUser(selectedGender, selectedCountry);

  if (waitingUserId) {
    const waitingSocket = io.sockets.sockets.get(waitingUserId);
    if (!waitingSocket || !waitingSocket.connected) {
      await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);
      return handleRcStart(selectedGender, selectedCountry, socket, cb, io);
    }

    const rooms = await redis.keys('room:*');
    let existingRoomId = null;
    for (const roomKey of rooms) {
      const room = await getRcRoom(roomKey.split(':')[1]);
      if (room && room.p1 === waitingUserId && room.isAvailable === 'true') {
        existingRoomId = roomKey.split(':')[1];
        break;
      }
    }

    if (existingRoomId) {
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);
        await saveRcRoom(existingRoomId, waitingUserId, socket.id, {
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
        });

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
        logger.info(`P1 (${waitingUserId}) paired with P2 (${socket.id}) in room ${existingRoomId}`);

        io.to(waitingUserId).emit('rc_remote-socket', { socketId: socket.id, userId });
        socket.emit('rc_remote-socket', { socketId: waitingUserId, userId: waitingSocket.handshake.query.userId });
        socket.emit('rc_roomid', existingRoomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${existingRoomId}`);
      } catch (error) {
        socket.emit('rc_error', 'Failed to join room');
        logger.error(`Error joining room ${existingRoomId}:`, error);
      }
    } else {
      const roomId = uuidv4();
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);

        await saveRcRoom(roomId, waitingUserId, socket.id, {
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
        });

        await connectionService.createConnection({
          roomId,
          p1UserId: waitingSocket.handshake.query.userId,
          p2UserId: userId,
          isLive: true,
        });

        socket.join(roomId);
        io.to(waitingUserId).emit('rc_remote-socket', { socketId: socket.id, userId });
        socket.emit('rc_remote-socket', { socketId: waitingUserId, userId: waitingSocket.handshake.query.userId });
        socket.emit('rc_roomid', roomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${roomId}`);
      } catch (error) {
        socket.emit('rc_error', 'Failed to create room');
        logger.error(`Error creating room ${roomId}:`, error);
      }
    }
  } else {
    const roomId = uuidv4();
    try {
      await saveRcRoom(roomId, socket.id, null, { p1UserId: userId });
      await addToWaitingList(selectedGender, selectedCountry, socket.id);
      socket.join(roomId);
      socket.emit('rc_roomid', roomId);
      cb('p1');
      logger.info(`Created waiting room ${roomId} for ${userId || 'anonymous'}`);
    } catch (error) {
      socket.emit('rc_error', 'Failed to create waiting room');
      logger.error(`Error creating waiting room ${roomId}:`, error);
    }
  }
}

async function handleRcDisconnect(disconnectedId, io) {
  const waitingKeys = await redis.keys('*:*');
  for (const key of waitingKeys) {
    if (key.includes(':') && !key.startsWith('room:')) {
      const [gender, country] = key.split(':');
      await removeFromWaitingList(gender, country, disconnectedId);
    }
  }

  const rooms = await redis.keys('room:*');
  for (const roomKey of rooms) {
    const room = await getRcRoom(roomKey.split(':')[1]);
    if (!room) continue;

    if (room.p1 === disconnectedId) {
      if (room.p2) {
        const p2Socket = io.sockets.sockets.get(room.p2);
        if (p2Socket && p2Socket.connected) {
          io.to(room.p2).emit('disconnected');
          await saveRcRoom(roomKey.split(':')[1], room.p2, null, { p1UserId: room.p2UserId, p2UserId: null });
          await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
        } else {
          await deleteRcRoom(roomKey.split(':')[1]);
          await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
        }
      } else {
        await deleteRcRoom(roomKey.split(':')[1]);
      }
      break;
    } else if (room.p2 === disconnectedId) {
      const p1Socket = io.sockets.sockets.get(room.p1);
      if (p1Socket && p1Socket.connected) {
        io.to(room.p1).emit('disconnected');
        await saveRcRoom(roomKey.split(':')[1], room.p1, null, { p1UserId: room.p1UserId, p2UserId: null });
        await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
      } else {
        await deleteRcRoom(roomKey.split(':')[1]);
        await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
      }
      break;
    }
  }
}

async function getRcType(id) {
  const rooms = await redis.keys('room:*');
  for (const roomKey of rooms) {
    const room = await getRcRoom(roomKey.split(':')[1]);
    if (!room) continue;
    if (room.p1 === id) return { type: 'p1', p2id: room.p2 || null };
    if (room.p2 === id) return { type: 'p2', p1id: room.p1 };
  }
  return false;
}

async function handleRcIceSend({ candidate, to }, socket, io) {
  const type = await getRcType(socket.id);
  if (type && ((type.type === 'p1' && type.p2id === to) || (type.type === 'p2' && type.p1id === to))) {
    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('rc_ice:reply', { candidate, from: socket.id });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('rc_error', 'Peer unavailable');
        }
      }, 5000);
    } else {
      socket.emit('rc_error', 'Peer disconnected');
    }
  }
}

async function handleRcSdpSend({ sdp, to }, socket, io) {
  const type = await getRcType(socket.id);
  if (type && ((type.type === 'p1' && type.p2id === to) || (type.type === 'p2' && type.p1id === to))) {
    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('rc_sdp:reply', { sdp, from: socket.id });
    } else {
      socket.emit('rc_error', 'Peer disconnected');
    }
  }
}

function handleRcSendMessage(input, type, roomId, socket, io) {
  socket.to(roomId).emit('rc_get-message', input, type);
}

async function handleRcEndChat(roomId, socket, io) {
  const room = await getRcRoom(roomId);
  if (!room) {
    socket.emit('rc_error', 'Room not found');
    return;
  }

  io.to(roomId).emit('rc_end-chat');
  await connectionService.updateConnection(roomId, { isLive: false });
  await deleteRcRoom(roomId);
  logger.info(`Room ${roomId} ended by ${socket.id}`);
}

async function handleRcNextChat(roomId, socket, io) {
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
    const room = await getRcRoom(roomId);
    if (!room) {
      socket.emit('rc_error', 'Room not found');
      return;
    }

    const p1SocketId = room.p1;
    const p2SocketId = room.p2;
    const p1UserId = room.p1UserId;
    const p2UserId = room.p2UserId;

    // Xóa phòng hiện tại
    await deleteRcRoom(roomId);
    const updatedConnection = await connectionService.updateConnection(roomId, { isLive: false });
    if (!updatedConnection) {
      logger.warn(`No connection found for room ${roomId}`);
    }
    io.to(roomId).emit('rc_next-chat');
    logger.info(`Room ${roomId} ended for next chat by ${socket.id}`);

    // Tạo phòng mới và thêm vào danh sách chờ cho p1 (nếu còn kết nối)
    if (p1SocketId) {
      const p1Socket = io.sockets.sockets.get(p1SocketId);
      if (p1Socket && p1Socket.connected) {
        const selectedGender = p1Socket.handshake.query.selectedGender;
        const selectedCountry = p1Socket.handshake.query.selectedCountry;
        if (!selectedGender || !selectedCountry) {
          p1Socket.emit('rc_error', 'Missing gender or country information');
          logger.error(`Missing selectedGender or selectedCountry for p1 (${p1SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveRcRoom(newRoomId, p1SocketId, null, { p1UserId });
            await addToWaitingList(selectedGender, selectedCountry, p1SocketId);
            p1Socket.join(newRoomId);
            p1Socket.emit('rc_roomid', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p1 (${p1SocketId})`);
          } catch (error) {
            p1Socket.emit('rc_error', 'Failed to create waiting room');
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
          p2Socket.emit('rc_error', 'Missing gender or country information');
          logger.error(`Missing selectedGender or selectedCountry for p2 (${p2SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveRcRoom(newRoomId, p2SocketId, null, { p1UserId: p2UserId });
            await addToWaitingList(selectedGender, selectedCountry, p2SocketId);
            p2Socket.join(newRoomId);
            p2Socket.emit('rc_roomid', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p2 (${p2SocketId})`);
          } catch (error) {
            p2Socket.emit('rc_error', 'Failed to create waiting room');
            logger.error(`Error creating waiting room ${newRoomId} for p2:`, error);
          }
        }
      }
    }
  } catch (error) {
    socket.emit('rc_error', 'Failed to process next chat');
    logger.error(`Error in handleRcNextChat for room ${roomId}:`, error);
  }
}

async function handleStartLivestream({ livestreamName, livestreamGreeting, livestreamAnnouncement }, socket, cb, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    cb(null);
    return;
  }

  try {
    const hostUserId = socket.handshake.query.userId;
    const hostSocketId = socket.id;

    if (!hostUserId) {
      socket.emit('error:livestream', 'User ID required to start livestream');
      logger.error('Host user ID missing');
      cb(null);
      return;
    }

    const livestream = await livestreamService.createLivestream({
      livestreamName,
      livestreamGreeting,
      livestreamAnnouncement,
      host: { userId: hostUserId, socketId: hostSocketId },
    });
    const livestreamId = livestream._id.toString();

    await saveLtRoom(livestreamId, { hostUserId, hostSocketId }, []);

    socket.join(livestreamId);
    socket.data.connectionType = 'lt';
    socket.data.livestreamId = livestreamId;
    socket.data.isAuthenticated = true;

    io.to(livestreamId).emit('livestream:started', { livestreamId });
    logger.info(`Livestream ${livestreamId} started by host ${hostSocketId}`);
    cb(livestreamId);
  } catch (error) {
    socket.emit('error:livestream', `Failed to start livestream: ${error.message}`);
    logger.error(`Error starting livestream:`, error);
    cb(null);
  }
}

async function handleJoinLivestream({ livestreamId }, socket, cb, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    cb({ success: false, message: 'Failed to join livestream' });
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      cb({ success: false, message: 'Livestream not found' });
      return;
    }

    const guestUserId = socket.handshake.query.userId;
    const guestSocketId = socket.id;

    socket.join(livestreamId);
    socket.data.connectionType = 'lt';
    socket.data.livestreamId = livestreamId;
    socket.data.isAuthenticated = !!guestUserId;

    if (guestUserId) {
      await addGuestToLtRoom(livestreamId, { guestUserId, guestSocketId });
      io.to(livestreamId).emit('livestream:joined', { guestUserId, guestSocketId });
      logger.info(`Authenticated guest ${guestSocketId} joined livestream ${livestreamId}`);
    } else {
      logger.info(`Anonymous user ${guestSocketId} joined livestream ${livestreamId}`);
    }

    cb({ success: true, message: 'Joined livestream successfully' });
  } catch (error) {
    socket.emit('error:livestream', `Failed to join livestream: ${error.message}`);
    logger.error(`Error joining livestream ${livestreamId}:`, error);
    cb({ success: false, message: 'Failed to join livestream' });
  }
}

async function handleSendMessage({ livestreamId, message, type }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('error:livestream', 'Unauthorized: Must be logged in to send messages');
      logger.error(`Anonymous user ${senderSocketId} attempted to send message in ${livestreamId}`);
      return;
    }

    const isHost = roomData.hostUserId === senderId && roomData.hostSocketId === senderSocketId;
    const isGuest = roomData.guests.some((g) => g.guestUserId === senderId && g.guestSocketId === senderSocketId);

    if (!isHost && !isGuest) {
      socket.emit('error:livestream', 'Unauthorized: Not a host or guest');
      logger.error(`Unauthorized message from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (type !== 'host' && type !== 'guest') {
      socket.emit('error:livestream', 'Invalid message type');
      logger.error(`Invalid message type ${type} from ${senderId}`);
      return;
    }

    io.to(livestreamId).emit('message:sent', { message, type, senderId });
    logger.info(`Message sent in livestream ${livestreamId} by ${senderId} (${type})`);
  } catch (error) {
    socket.emit('error:livestream', `Failed to send message: ${error.message}`);
    logger.error(`Error sending message in livestream ${livestreamId}:`, error);
  }
}

async function handleHostIceSend({ livestreamId, candidate, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (roomData.hostUserId !== senderId || roomData.hostSocketId !== senderSocketId) {
      socket.emit('error:livestream', 'Unauthorized: Not the host');
      logger.error(`Unauthorized ICE from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('host:ice:reply', { candidate, from: senderSocketId });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('error:livestream', 'Guest unavailable');
        }
      }, 5000);
    } else {
      socket.emit('error:livestream', 'Guest disconnected');
      logger.error(`Guest ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('error:livestream', `Failed to send ICE: ${error.message}`);
    logger.error(`Error sending ICE in livestream ${livestreamId}:`, error);
  }
}

async function handleGuestIceSend({ livestreamId, candidate, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('error:livestream', 'Unauthorized: Must be logged in to send ICE');
      logger.error(`Anonymous user ${senderSocketId} attempted to send ICE in ${livestreamId}`);
      return;
    }

    const isGuest = roomData.guests.some((g) => g.guestUserId === senderId && g.guestSocketId === senderSocketId);
    if (!isGuest) {
      socket.emit('error:livestream', 'Unauthorized: Not a guest');
      logger.error(`Unauthorized ICE from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (roomData.hostSocketId !== to) {
      socket.emit('error:livestream', 'Invalid destination: Not the host');
      logger.error(`Invalid ICE destination ${to} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('guest:ice:reply', { candidate, from: senderSocketId });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('error:livestream', 'Host unavailable');
        }
      }, 5000);
    } else {
      socket.emit('error:livestream', 'Host disconnected');
      logger.error(`Host ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('error:livestream', `Failed to send ICE: ${error.message}`);
    logger.error(`Error sending ICE in livestream ${livestreamId}:`, error);
  }
}

async function handleHostSdpSend({ livestreamId, sdp, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (roomData.hostUserId !== senderId || roomData.hostSocketId !== senderSocketId) {
      socket.emit('error:livestream', 'Unauthorized: Not the host');
      logger.error(`Unauthorized SDP from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('host:sdp:reply', { sdp, from: senderSocketId });
    } else {
      socket.emit('error:livestream', 'Guest disconnected');
      logger.error(`Guest ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('error:livestream', `Failed to send SDP: ${error.message}`);
    logger.error(`Error sending SDP in livestream ${livestreamId}:`, error);
  }
}

async function handleGuestSdpSend({ livestreamId, sdp, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId); // Sửa lỗi gọi hàm getRoom thành getLtRoom
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('error:livestream', 'Unauthorized: Must be logged in to send SDP');
      logger.error(`Anonymous user ${senderSocketId} attempted to send SDP in ${livestreamId}`);
      return;
    }

    const isGuest = roomData.guests.some((g) => g.guestUserId === senderId && g.guestSocketId === senderSocketId);
    if (!isGuest) {
      socket.emit('error:livestream', 'Unauthorized: Not a guest');
      logger.error(`Unauthorized SDP from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (roomData.hostSocketId !== to) {
      socket.emit('error:livestream', 'Invalid destination: Not the host');
      logger.error(`Invalid SDP destination ${to} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('guest:sdp:reply', { sdp, from: senderSocketId });
    } else {
      socket.emit('error:livestream', 'Host disconnected');
      logger.error(`Host ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('error:livestream', `Failed to send SDP: ${error.message}`);
    logger.error(`Error sending SDP in livestream ${livestreamId}:`, error);
  }
}

async function handleEndLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    if (roomData.hostUserId !== senderId) {
      socket.emit('error:livestream', 'Unauthorized: Only host can end livestream');
      logger.error(`Unauthorized end livestream attempt by ${senderId} in ${livestreamId}`);
      return;
    }

    await livestreamService.updateLivestream(livestreamId, { isLive: false });
    io.to(livestreamId).emit('livestream:ended');
    await deleteLtRoom(livestreamId);
    logger.info(`Livestream ${livestreamId} ended by host ${senderId}`);
  } catch (error) {
    socket.emit('error:livestream', `Failed to end livestream: ${error.message}`);
    logger.error(`Error ending livestream ${livestreamId}:`, error);
  }
}

async function handleNextLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    // Rời livestream hiện tại
    socket.leave(livestreamId);
    await removeGuestFromLtRoom(livestreamId, senderSocketId);
    io.to(livestreamId).emit('livestream:left', { guestUserId: senderId, guestSocketId: senderSocketId });
    logger.info(`Guest ${senderSocketId} left livestream ${livestreamId} for switching`);

    // Tìm livestream mới
    const activeLivestreams = await livestreamService.getActiveLivestreams({ excludeId: livestreamId });
    if (!activeLivestreams || activeLivestreams.length === 0) {
      socket.emit('error:livestream', 'No other active livestreams available');
      logger.info(`No other active livestreams available for guest ${senderSocketId}`);
      socket.data.connectionType = null;
      socket.data.livestreamId = null;
      return;
    }

    // Chọn livestream ngẫu nhiên (hoặc theo logic khác, ví dụ: dựa trên số guest ít nhất)
    const newLivestream = activeLivestreams[Math.floor(Math.random() * activeLivestreams.length)];
    const newLivestreamId = newLivestream._id.toString();

    // Tham gia livestream mới
    const newRoomData = await getLtRoom(newLivestreamId);
    if (!newRoomData) {
      socket.emit('error:livestream', 'New livestream not found');
      logger.error(`New livestream ${newLivestreamId} not found`);
      socket.data.connectionType = null;
      socket.data.livestreamId = null;
      return;
    }

    socket.join(newLivestreamId);
    socket.data.livestreamId = newLivestreamId;
    await addGuestToLtRoom(newLivestreamId, { guestUserId: senderId, guestSocketId: senderSocketId });
    io.to(newLivestreamId).emit('livestream:joined', { guestUserId: senderId, guestSocketId: senderSocketId });
    logger.info(`Guest ${senderSocketId} joined new livestream ${newLivestreamId}`);

    // Emit sự kiện livestream:next để thông báo chuyển thành công
    socket.emit('livestream:next', { newLivestreamId });
    logger.info(`Guest ${senderSocketId} switched from livestream ${livestreamId} to ${newLivestreamId}`);
  } catch (error) {
    socket.emit('error:livestream', `Failed to switch livestream: ${error.message}`);
    logger.error(`Error switching livestream for ${senderSocketId} from ${livestreamId}:`, error);
    socket.data.connectionType = null;
    socket.data.livestreamId = null;
  }
}

async function handleLeaveLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('error:livestream', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLtRoom(livestreamId);
    if (!roomData) {
      socket.emit('error:livestream', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    socket.leave(livestreamId);
    socket.data.connectionType = null;
    socket.data.livestreamId = null;

    if (senderId && socket.data.isAuthenticated) {
      const isGuest = roomData.guests.some((g) => g.guestUserId === senderId && g.guestSocketId === senderSocketId);
      if (isGuest) {
        await removeGuestFromLtRoom(livestreamId, senderSocketId);
        io.to(livestreamId).emit('livestream:left', { guestUserId: senderId, guestSocketId: senderSocketId });
        logger.info(`Authenticated guest ${senderSocketId} left livestream ${livestreamId}`);
      } else {
        logger.info(`Authenticated user ${senderSocketId} left livestream ${livestreamId} (not in guest list)`);
      }
    } else {
      logger.info(`Anonymous user ${senderSocketId} left livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('error:livestream', `Failed to leave livestream: ${error.message}`);
    logger.error(`Error leaving livestream ${livestreamId}:`, error);
  }
}

async function handleDisconnect(disconnectedId, socket, io) {
  if (socket.data.connectionType !== 'lt') return;

  const livestreamId = socket.data.livestreamId;
  if (!livestreamId) return;

  const roomData = await getLtRoom(livestreamId);
  if (!roomData) return;

  if (roomData.hostUserId === socket.handshake.query.userId) {
    await livestreamService.updateLivestream(livestreamId, { isLive: false });
    io.to(livestreamId).emit('livestream:ended');
    await deleteLtRoom(livestreamId);
    logger.info(`Livestream ${livestreamId} ended due to host ${disconnectedId} disconnect`);
  } else if (socket.data.isAuthenticated) {
    const isGuest = roomData.guests.some((g) => g.guestSocketId === disconnectedId);
    if (isGuest) {
      await removeGuestFromLtRoom(livestreamId, disconnectedId);
      io.to(livestreamId).emit('livestream:left', {
        guestUserId: socket.handshake.query.userId,
        guestSocketId: disconnectedId,
      });
      logger.info(`Authenticated guest ${disconnectedId} left livestream ${livestreamId} due to disconnect`);
    }
  } else {
    logger.info(`Anonymous user ${disconnectedId} disconnected from livestream ${livestreamId}`);
  }
}

module.exports = {
  handleRcStart,
  getRcType,
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
};
