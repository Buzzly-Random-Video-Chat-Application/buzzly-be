const { v4: uuidv4 } = require('uuid');
const {
  addToWaitingList,
  getFirstWaitingUser,
  removeFromWaitingList,

  saveVideoChatRoom,
  getVideoChatRoom,
  deleteVideoChatRoom,

  saveLivestreamRoom,
  getLivestreamRoom,
  addGuestToLivestreamRoom,
  removeGuestFromLivestreamRoom,
  deleteLivestreamRoom,
  getLivestreamGuestCount,
  redis,
} = require('../config/redis');
const logger = require('../config/logger');
const { connectionService, livestreamService } = require('../services');
const { Connection } = require('../models');

/** VIDEO CHAT */

/**
 * Handles the start of a video chat by matching users based on gender and country.
 * @param {string} selectedGender - The gender to match with.
 * @param {string} selectedCountry - The country to match with.
 * @param {Socket} socket - The socket object of the user.
 * @param {Function} cb - Callback to return the participant type ('p1' or 'p2').
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatStart(selectedGender, selectedCountry, socket, cb, io) {
  const userId = socket.handshake.query.userId;

  if (!selectedGender || !selectedCountry) {
    socket.emit('video-chat:error', 'Missing gender or country information');
    logger.error(`Missing selected gender or selected country for socket ${socket.id}`);
    cb(null);
    return;
  }

  let waitingSocketId = await getFirstWaitingUser(selectedGender, selectedCountry);

  if (waitingSocketId) {
    const waitingSocket = io.sockets.sockets.get(waitingSocketId);
    if (!waitingSocket || !waitingSocket.connected) {
      await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);
      return handleVideoChatStart(selectedGender, selectedCountry, socket, cb, io);
    }

    const rooms = await redis.keys('room:*');
    let existingRoomId = null;
    for (const roomKey of rooms) {
      const room = await getVideoChatRoom(roomKey.split(':')[1]);
      if (room && room.p1 == waitingSocketId && room.isAvailable == 'true') {
        existingRoomId = roomKey.split(':')[1];
        break;
      }
    }

    if (existingRoomId) {
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);
        await saveVideoChatRoom(existingRoomId, waitingSocketId, socket.id, {
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
        logger.info(`P1 (${waitingSocketId}) paired with P2 (${socket.id}) in room ${existingRoomId}`);

        io.to(waitingSocketId).emit('video-chat:joined', { socketId: socket.id, userId });
        socket.emit('video-chat:joined', { socketId: waitingSocketId, userId: waitingSocket.handshake.query.userId });
        socket.emit('video-chat:send-room', existingRoomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${existingRoomId}`);
      } catch (error) {
        socket.emit('video-chat:error', 'Failed to join room');
        logger.error(`Error joining room ${existingRoomId}:`, error);
      }
    } else {
      const roomId = uuidv4();
      try {
        await removeFromWaitingList(selectedGender, selectedCountry, waitingSocketId);

        await saveVideoChatRoom(roomId, waitingSocketId, socket.id, {
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
        io.to(waitingSocketId).emit('video-chat:joined', { socketId: socket.id, userId });
        socket.emit('video-chat:joined', { socketId: waitingSocketId, userId: waitingSocket.handshake.query.userId });
        socket.emit('video-chat:send-room', roomId);
        cb('p2');
        logger.info(`${userId || 'anonymous'} joined room ${roomId}`);
      } catch (error) {
        socket.emit('video-chat:error', 'Failed to create room');
        logger.error(`Error creating room ${roomId}:`, error);
      }
    }
  } else {
    const roomId = uuidv4();
    try {
      await saveVideoChatRoom(roomId, socket.id, null, { p1UserId: userId });
      await addToWaitingList(selectedGender, selectedCountry, socket.id);
      socket.join(roomId);
      socket.emit('video-chat:send-room', roomId);
      cb('p1');
      logger.info(`Created waiting room ${roomId} for ${userId || 'anonymous'}`);
    } catch (error) {
      socket.emit('video-chat:error', 'Failed to create waiting room');
      logger.error(`Error creating waiting room ${roomId}:`, error);
    }
  }
}

/**
 * Handles the disconnection of a video chat by removing the user from the waiting list and updating the connection.
 * @param {string} disconnectedId - The ID of the disconnected user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatDisconnect(disconnectedId, io) {
  const waitingKeys = await redis.keys('*:*');
  for (const key of waitingKeys) {
    if (key.includes(':') && !key.startsWith('room:')) {
      const [gender, country] = key.split(':');
      await removeFromWaitingList(gender, country, disconnectedId);
    }
  }

  const rooms = await redis.keys('room:*');
  for (const roomKey of rooms) {
    const room = await getVideoChatRoom(roomKey.split(':')[1]);
    if (!room) continue;

    if (room.p1 == disconnectedId) {
      if (room.p2) {
        const p2Socket = io.sockets.sockets.get(room.p2);
        if (p2Socket && p2Socket.connected) {
          io.to(room.p2).emit('video-chat:disconnected');
          await saveVideoChatRoom(roomKey.split(':')[1], room.p2, null, { p1UserId: room.p2UserId, p2UserId: null });
          await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
        } else {
          await deleteVideoChatRoom(roomKey.split(':')[1]);
          await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
        }
      } else {
        await deleteVideoChatRoom(roomKey.split(':')[1]);
      }
      break;
    } else if (room.p2 == disconnectedId) {
      const p1Socket = io.sockets.sockets.get(room.p1);
      if (p1Socket && p1Socket.connected) {
        io.to(room.p1).emit('video-chat:disconnected');
        await saveVideoChatRoom(roomKey.split(':')[1], room.p1, null, { p1UserId: room.p1UserId, p2UserId: null });
        await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
      } else {
        await deleteVideoChatRoom(roomKey.split(':')[1]);
        await connectionService.updateConnection(roomKey.split(':')[1], { isLive: false });
      }
      break;
    }
  }
}

/**
 * Handles the type of a video chat by checking the room.
 * @param {string} id - The ID of the user.
 * @returns {Object} - The type of the user and the ID of the other user.
 */
async function getVideoChatType(id) {
  const rooms = await redis.keys('room:*');
  for (const roomKey of rooms) {
    const room = await getVideoChatRoom(roomKey.split(':')[1]);
    if (!room) continue;
    if (room.p1 == id) return { type: 'p1', p2id: room.p2 };
    if (room.p2 == id) return { type: 'p2', p1id: room.p1 };
  }
  return null;
}

/**
 * Handles the ICE send of a video chat by sending the candidate to the other user.
 * @param {Object} { candidate, to } - The candidate and the ID of the user to send the candidate to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatIceSend({ candidate, to }, socket, io) {
  const type = await getVideoChatType(socket.id);
  if (type && ((type.type == 'p1' && type.p2id == to) || (type.type == 'p2' && type.p1id == to))) {
    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('video-chat:ice:reply', { candidate, from: socket.id });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('video-chat:error', 'Peer unavailable');
        }
      }, 5000);
    } else {
      socket.emit('video-chat:error', 'Peer disconnected');
    }
  }
}

/**
 * Handles the SDP send of a video chat by sending the SDP to the other user.
 * @param {Object} { sdp, to } - The SDP and the ID of the user to send the SDP to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatSdpSend({ sdp, to }, socket, io) {
  const type = await getVideoChatType(socket.id);
  if (type && ((type.type == 'p1' && type.p2id == to) || (type.type == 'p2' && type.p1id == to))) {
    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('video-chat:sdp:reply', { sdp, from: socket.id });
    } else {
      socket.emit('video-chat:error', 'Peer disconnected');
    }
  }
}

/**
 * Handles the message send of a video chat by sending the message to the other user.
 * @param {string} message - The message to send.
 * @param {string} userType - The type of the message.
 * @param {string} roomId - The ID of the room.
 * @param {Socket} socket - The socket object of the user.
 */
async function handleVideoChatSendMessage(message, userType, roomId, socket) {
    try {
        const room = await getVideoChatRoom(roomId);
        if (!room) {
            socket.emit('video-chat:error', 'Room not found');
            return;
        }
        socket.to(roomId).emit('video-chat:get-message', message, userType);
    } catch (error) {
        socket.emit('video-chat:error', 'Failed to send message');
    }
}

/**
 * Handles the end of a video chat by deleting the room and updating the connection.
 * @param {string} roomId - The ID of the room.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatEndChat(roomId, socket, io) {
  const room = await getVideoChatRoom(roomId);
  if (!room) {
    socket.emit('video-chat:error', 'Room not found');
    return;
  }

  io.to(roomId).emit('video-chat:end-chat');
  await connectionService.updateConnection(roomId, { isLive: false });
  await deleteVideoChatRoom(roomId);
  logger.info(`Room ${roomId} ended by ${socket.id}`);
}

/**
 * Handles the next chat of a video chat by creating a new room and adding the users to the waiting list.
 * @param {string} roomId - The ID of the room.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleVideoChatNextChat(roomId, socket, io) {
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
    const room = await getVideoChatRoom(roomId);
    if (!room) {
      socket.emit('video-chat:error', 'Room not found');
      return;
    }

    const p1SocketId = room.p1;
    const p2SocketId = room.p2;
    const p1UserId = room.p1UserId;
    const p2UserId = room.p2UserId;

    // Xóa phòng hiện tại
    await deleteVideoChatRoom(roomId);
    const updatedConnection = await connectionService.updateConnection(roomId, { isLive: false });
    if (!updatedConnection) {
      logger.warn(`No connection found for room ${roomId}`);
    }
    io.to(roomId).emit('video-chat:next-chat');
    logger.info(`Room ${roomId} ended for next chat by ${socket.id}`);

    // Tạo phòng mới và thêm vào danh sách chờ cho p1 (nếu còn kết nối)
    if (p1SocketId) {
      const p1Socket = io.sockets.sockets.get(p1SocketId);
      if (p1Socket && p1Socket.connected) {
        const selectedGender = p1Socket.handshake.query.selectedGender;
        const selectedCountry = p1Socket.handshake.query.selectedCountry;
        if (!selectedGender || !selectedCountry) {
          p1Socket.emit('video-chat:error', 'Missing gender or country information');
          logger.error(`Missing selected gender or selected country for p1 (${p1SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveVideoChatRoom(newRoomId, p1SocketId, null, { p1UserId });
            await addToWaitingList(selectedGender, selectedCountry, p1SocketId);
            p1Socket.join(newRoomId);
            p1Socket.emit('video-chat:send-room', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p1 (${p1SocketId})`);
          } catch (error) {
            p1Socket.emit('video-chat:error', 'Failed to create waiting room');
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
          p2Socket.emit('video-chat:error', 'Missing gender or country information');
          logger.error(`Missing selected gender or selected country for p2 (${p2SocketId})`);
        } else {
          const newRoomId = uuidv4();
          try {
            await saveVideoChatRoom(newRoomId, p2SocketId, null, { p1UserId: p2UserId });
            await addToWaitingList(selectedGender, selectedCountry, p2SocketId);
            p2Socket.join(newRoomId);
            p2Socket.emit('video-chat:send-room', newRoomId);
            logger.info(`Created new waiting room ${newRoomId} for p2 (${p2SocketId})`);
          } catch (error) {
            p2Socket.emit('video-chat:error', 'Failed to create waiting room');
            logger.error(`Error creating waiting room ${newRoomId} for p2:`, error);
          }
        }
      }
    }
  } catch (error) {
    socket.emit('video-chat:error', 'Failed to process next chat');
    logger.error(`Error in handle next chat for room ${roomId}:`, error);
  }
}

/** LIVESTREAM */

/**
 * Handles the start of a livestream by creating a new room and adding the host to the waiting list.
 * @param {Object} { livestreamName, livestreamGreeting, livestreamAnnouncement } - The name, greeting, and announcement of the livestream.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleStartLivestream({ livestreamName, livestreamGreeting, livestreamAnnouncement }, socket, cb, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    cb(null);
    return;
  }

  try {
    const hostUserId = socket.handshake.query.userId;
    const hostSocketId = socket.id;

    if (!hostUserId) {
      socket.emit('livestream:error', 'User ID required to start livestream');
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

    await saveLivestreamRoom(livestreamId, { hostUserId, hostSocketId }, []);

    socket.join(livestreamId);
    socket.data.type = 'livestream';
    socket.data.livestreamId = livestreamId;
    socket.data.isAuthenticated = true;

    io.to(livestreamId).emit('livestream:started', { livestreamId });
    logger.info(`Livestream ${livestreamId} started by host ${hostSocketId}`);
    cb(livestreamId);
  } catch (error) {
    socket.emit('livestream:error', `Failed to start livestream: ${error.message}`);
    logger.error(`Error starting livestream:`, error);
    cb(null);
  }
}

/**
 * Handles the join of a livestream by adding the guest to the waiting list.
 * @param {string} livestreamId - The ID of the livestream.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleJoinLivestream({ livestreamId }, socket, cb, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    cb({ success: false, message: 'Failed to join livestream' });
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      cb({ success: false, message: 'Livestream not found' });
      return;
    }

    const guestUserId = socket.handshake.query.userId;
    const guestSocketId = socket.id;

    const hostSocketId = roomData.hostSocketId;
    const hostUserId = roomData.hostUserId;

    socket.join(livestreamId);
    socket.data.type = 'livestream';
    socket.data.livestreamId = livestreamId;
    socket.data.isAuthenticated = !!guestUserId;

    if (guestUserId) {
      await addGuestToLivestreamRoom(livestreamId, { guestUserId, guestSocketId });
      io.to(livestreamId).emit('livestream:joined', { guestUserId, guestSocketId });
      logger.info(`Authenticated guest ${guestSocketId} joined livestream ${livestreamId}`);
    } else {
      await addGuestToLivestreamRoom(livestreamId, { guestUserId: 'anonymous', guestSocketId });
      io.to(livestreamId).emit('livestream:joined', { guestUserId: 'anonymous', guestSocketId });
      logger.info(`Anonymous user ${guestSocketId} joined livestream ${livestreamId}`);
    }

    const guestCount = await getLivestreamGuestCount(livestreamId);
    io.to(livestreamId).emit('livestream:guest-count', guestCount);

    cb({
      success: true,
      message: 'Joined livestream successfully',
      hostSocketId,
      hostUserId,
    });
  } catch (error) {
    socket.emit('livestream:error', `Failed to join livestream: ${error.message}`);
    logger.error(`Error joining livestream ${livestreamId}:`, error);
    cb({ success: false, message: 'Failed to join livestream' });
  }
}

/**
 * Handles the send message of a livestream by sending the message to the other user.
 * @param {Object} { livestreamId, message, type } - The ID of the livestream, the message, and the type of the message.
 * @param {Socket} socket - The socket object of the user.
 */
async function handleLivestreamSendMessage({ livestreamId, message, type }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('livestream:error', 'Unauthorized: Must be logged in to send messages');
      logger.error(`Anonymous user ${senderSocketId} attempted to send message in ${livestreamId}`);
      return;
    }

    const isHost = roomData.hostUserId == senderId && roomData.hostSocketId == senderSocketId;
    const isGuest = roomData.guests.some((g) => g.guestUserId == senderId && g.guestSocketId == senderSocketId);

    if (!isHost && !isGuest) {
      socket.emit('livestream:error', 'Unauthorized: Not a host or guest to send message');
      logger.error(`Unauthorized message from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (type !== 'host' && type !== 'guest') {
      socket.emit('livestream:error', 'Invalid message type to send message');
      logger.error(`Invalid message type ${type} from ${senderId}`);
      return;
    }

    io.to(livestreamId).emit('livestream:get-message', { message, type, senderId });
    logger.info(`Message sent in livestream ${livestreamId} by ${senderId} (${type})`);
  } catch (error) {
    socket.emit('livestream:error', `Failed to send message: ${error.message}`);
    logger.error(`Error sending message in livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the ICE send of a livestream by sending the candidate to the other user.
 * @param {Object} { livestreamId, candidate, to } - The ID of the livestream, the candidate, and the ID of the user to send the candidate to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleHostIceSend({ livestreamId, candidate, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (roomData.hostUserId !== senderId || roomData.hostSocketId !== senderSocketId) {
      socket.emit('livestream:error', 'Unauthorized: Not the host');
      logger.error(`Unauthorized ICE from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('host:ice:reply', { candidate, from: senderSocketId });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('livestream:error', 'Guest unavailable');
        }
      }, 5000);
    } else {
      socket.emit('livestream:error', 'Guest disconnected');
      logger.error(`Guest ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('livestream:error', `Failed to send ICE: ${error.message}`);
    logger.error(`Error sending ICE in livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the ICE send of a livestream by sending the candidate to the other user.
 * @param {Object} { livestreamId, candidate, to } - The ID of the livestream, the candidate, and the ID of the user to send the candidate to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleGuestIceSend({ livestreamId, candidate, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('livestream:error', 'Unauthorized: Must be logged in to send ICE');
      logger.error(`Anonymous user ${senderSocketId} attempted to send ICE in ${livestreamId}`);
      return;
    }

    const isGuest = roomData.guests.some((g) => g.guestUserId == senderId && g.guestSocketId == senderSocketId);
    if (!isGuest) {
      socket.emit('livestream:error', 'Unauthorized: Not a guest');
      logger.error(`Unauthorized ICE from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (roomData.hostSocketId !== to) {
      socket.emit('livestream:error', 'Invalid destination: Not the host');
      logger.error(`Invalid ICE destination ${to} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('guest:ice:reply', { candidate, from: senderSocketId });
      setTimeout(() => {
        if (!io.sockets.sockets.get(to)) {
          socket.emit('livestream:error', 'Host unavailable');
        }
      }, 5000);
    } else {
      socket.emit('livestream:error', 'Host disconnected');
      logger.error(`Host ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('livestream:error', `Failed to send ICE: ${error.message}`);
    logger.error(`Error sending ICE in livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the SDP send of a livestream by sending the SDP to the other user.
 * @param {Object} { livestreamId, sdp, to } - The ID of the livestream, the SDP, and the ID of the user to send the SDP to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleHostSdpSend({ livestreamId, sdp, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (roomData.hostUserId !== senderId || roomData.hostSocketId !== senderSocketId) {
      socket.emit('livestream:error', 'Unauthorized: Not the host');
      logger.error(`Unauthorized SDP from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('host:sdp:reply', { sdp, from: senderSocketId });
    } else {
      socket.emit('livestream:error', 'Guest disconnected');
      logger.error(`Guest ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('livestream:error', `Failed to send SDP: ${error.message}`);
    logger.error(`Error sending SDP in livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the SDP send of a livestream by sending the SDP to the other user.
 * @param {Object} { livestreamId, sdp, to } - The ID of the livestream, the SDP, and the ID of the user to send the SDP to.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleGuestSdpSend({ livestreamId, sdp, to }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    if (!socket.data.isAuthenticated || !senderId) {
      socket.emit('livestream:error', 'Unauthorized: Must be logged in to send SDP');
      logger.error(`Anonymous user ${senderSocketId} attempted to send SDP in ${livestreamId}`);
      return;
    }

    const isGuest = roomData.guests.some((g) => g.guestUserId == senderId && g.guestSocketId == senderSocketId);
    if (!isGuest) {
      socket.emit('livestream:error', 'Unauthorized: Not a guest');
      logger.error(`Unauthorized SDP from ${senderId} in livestream ${livestreamId}`);
      return;
    }

    if (roomData.hostSocketId !== to) {
      socket.emit('livestream:error', 'Invalid destination: Not the host');
      logger.error(`Invalid SDP destination ${to} in livestream ${livestreamId}`);
      return;
    }

    const toSocket = io.sockets.sockets.get(to);
    if (toSocket && toSocket.connected) {
      io.to(to).emit('guest:sdp:reply', { sdp, from: senderSocketId });
    } else {
      socket.emit('livestream:error', 'Host disconnected');
      logger.error(`Host ${to} disconnected in livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('livestream:error', `Failed to send SDP: ${error.message}`);
    logger.error(`Error sending SDP in livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the end of a livestream by deleting the room and updating the connection.
 * @param {string} livestreamId - The ID of the livestream.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleEndLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    if (roomData.hostUserId !== senderId) {
      socket.emit('livestream:error', 'Unauthorized: Only host can end livestream');
      logger.error(`Unauthorized end livestream attempt by ${senderId} in ${livestreamId}`);
      return;
    }

    await livestreamService.updateLivestream(livestreamId, { isLive: false });
    await deleteLivestreamRoom(livestreamId);

    io.to(livestreamId).emit('livestream:ended');
    logger.info(`Livestream ${livestreamId} ended by host ${senderId}`);
  } catch (error) {
    socket.emit('livestream:error', `Failed to end livestream: ${error.message}`);
    logger.error(`Error ending livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the next livestream by switching to a new livestream.
 * @param {string} livestreamId - The ID of the livestream.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleNextLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    // Rời livestream hiện tại
    socket.leave(livestreamId);
    await removeGuestFromLivestreamRoom(livestreamId, senderSocketId);
    io.to(livestreamId).emit('livestream:left', { guestSocketId: senderSocketId });
    logger.info(`Guest ${senderSocketId} left livestream ${livestreamId} for switching`);

    // Tìm livestream mới
    const activeLivestreams = await livestreamService.getActiveLivestreams({ excludeId: livestreamId });
    if (!activeLivestreams || activeLivestreams.length == 0) {
      socket.emit('livestream:error', 'No other active livestreams available');
      logger.info(`No other active livestreams available for guest ${senderSocketId}`);
      socket.data.type = null;
      socket.data.livestreamId = null;
      return;
    }

    // Chọn livestream ngẫu nhiên
    const newLivestream = activeLivestreams[Math.floor(Math.random() * activeLivestreams.length)];
    const newLivestreamId = newLivestream._id.toString();

    // Tham gia livestream mới
    const newRoomData = await getLivestreamRoom(newLivestreamId);
    if (!newRoomData) {
      socket.emit('livestream:error', 'New livestream not found');
      logger.error(`New livestream ${newLivestreamId} not found`);
      socket.data.type = null;
      socket.data.livestreamId = null;
      return;
    }

    socket.join(newLivestreamId);
    socket.data.livestreamId = newLivestreamId;
    await addGuestToLivestreamRoom(newLivestreamId, { guestUserId: senderId, guestSocketId: senderSocketId });
    io.to(newLivestreamId).emit('livestream:joined', { guestUserId: senderId, guestSocketId: senderSocketId });
    logger.info(`Guest ${senderSocketId} joined new livestream ${newLivestreamId}`);

    // Emit sự kiện livestream:next-clicked để thông báo chuyển thành công
    socket.emit('livestream:next-clicked', { newLivestreamId });
    logger.info(`Guest ${senderSocketId} switched from livestream ${livestreamId} to ${newLivestreamId}`);
  } catch (error) {
    socket.emit('livestream:error', `Failed to switch livestream: ${error.message}`);
    logger.error(`Error switching livestream for ${senderSocketId} from ${livestreamId}:`, error);
    socket.data.type = null;
    socket.data.livestreamId = null;
  }
}

/**
 * Handles the leave of a livestream by removing the user from the waiting list.
 * @param {string} livestreamId - The ID of the livestream.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleLeaveLivestream({ livestreamId }, socket, io) {
  if (!redis.isOpen) {
    socket.emit('livestream:error', 'Redis unavailable');
    logger.error('Redis client is closed');
    return;
  }

  try {
    const roomData = await getLivestreamRoom(livestreamId);
    if (!roomData) {
      socket.emit('livestream:error', 'Livestream not found');
      logger.error(`Livestream ${livestreamId} not found`);
      return;
    }

    const senderId = socket.handshake.query.userId;
    const senderSocketId = socket.id;

    socket.leave(livestreamId);
    socket.data.type = null;
    socket.data.livestreamId = null;

    if (senderId && socket.data.isAuthenticated) {
      const isGuest = roomData.guests.some((g) => g.guestUserId == senderId && g.guestSocketId == senderSocketId);
      if (isGuest) {
        await removeGuestFromLivestreamRoom(livestreamId, senderSocketId);
        const guestCount = await getLivestreamGuestCount(livestreamId);
        io.in(livestreamId).emit('livestream:guest-count', guestCount);
        io.in(livestreamId).emit('livestream:left', { guestSocketId: senderSocketId });
        socket.emit('livestream:left', { guestSocketId: senderSocketId });

        logger.info(`Authenticated guest ${senderSocketId} left livestream ${livestreamId}`);
      } else {
        logger.info(`Authenticated user ${senderSocketId} left livestream ${livestreamId} (not in guest list)`);
      }
    } else {
      logger.info(`Anonymous user ${senderSocketId} left livestream ${livestreamId}`);
    }
  } catch (error) {
    socket.emit('livestream:error', `Failed to leave livestream: ${error.message}`);
    logger.error(`Error leaving livestream ${livestreamId}:`, error);
  }
}

/**
 * Handles the disconnect of a livestream by removing the user from the waiting list.
 * @param {string} disconnectedSocketId - The ID of the disconnected socket.
 * @param {Socket} socket - The socket object of the user.
 * @param {Server} io - The Socket.IO server instance.
 */
async function handleLivestreamDisconnect(disconnectedSocketId, socket, io) {
  if (socket.data.type !== 'livestream') return;

  const livestreamId = socket.data.livestreamId;
  if (!livestreamId) return;

  const roomData = await getLivestreamRoom(livestreamId);
  if (!roomData) return;

  if (roomData.hostUserId == socket.handshake.query.userId) {
    await livestreamService.updateLivestream(livestreamId, { isLive: false });
    io.to(livestreamId).emit('livestream:ended');
    await deleteLivestreamRoom(livestreamId);
    logger.info(`Livestream ${livestreamId} ended due to host ${disconnectedSocketId} disconnect`);
  } else if (socket.data.isAuthenticated) {
    const isGuest = roomData.guests.some((g) => g.guestSocketId == disconnectedSocketId);
    if (isGuest) {
      await removeGuestFromLivestreamRoom(livestreamId, disconnectedSocketId);
      io.to(livestreamId).emit('livestream:left', {
        guestSocketId: disconnectedSocketId,
      });
      logger.info(`Authenticated guest ${disconnectedSocketId} left livestream ${livestreamId} due to disconnect`);
    }
  } else {
    logger.info(`Anonymous user ${disconnectedSocketId} disconnected from livestream ${livestreamId}`);
  }
}

module.exports = {
  // Video Chat
  handleVideoChatStart,
  handleVideoChatDisconnect,
  handleVideoChatIceSend,
  handleVideoChatSdpSend,
  handleVideoChatSendMessage,
  handleVideoChatEndChat,
  handleVideoChatNextChat,
  getVideoChatType,
  // Livestream
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
};
