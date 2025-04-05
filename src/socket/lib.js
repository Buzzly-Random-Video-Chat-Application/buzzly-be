const { v4: uuidv4 } = require('uuid');
const {
    addToWaitingList,
    getFirstWaitingUser,
    removeFromWaitingList,
    saveRoom,
    getRoom,
    deleteRoom,
    redis,
} = require('../config/redis');
const logger = require('../config/logger');

async function handelStart(selectedGender, selectedCountry, socket, cb, io) {
    let waitingUserId = await getFirstWaitingUser(selectedGender, selectedCountry);

    if (waitingUserId) {
        const waitingSocket = io.sockets.sockets.get(waitingUserId);
        if (!waitingSocket || !waitingSocket.connected) {
            await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);
            return handelStart(selectedGender, selectedCountry, socket, cb, io);
        }

        const rooms = await redis.keys('room:*');
        let existingRoomId = null;
        for (const roomKey of rooms) {
            const room = await getRoom(roomKey.split(':')[1]);
            if (room && room.p1 === waitingUserId && room.isAvailable === 'true') {
                existingRoomId = roomKey.split(':')[1];
                break;
            }
        }

        if (existingRoomId) {
            try {
                await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);
                await saveRoom(existingRoomId, waitingUserId, socket.id);

                socket.join(existingRoomId);
                logger.info(`P1 (${waitingUserId}) paired with P2 (${socket.id}) in room ${existingRoomId}`);
                io.to(waitingUserId).emit('remote-socket', socket.id);
                socket.emit('remote-socket', waitingUserId);
                socket.emit('roomid', existingRoomId);
                cb('p2');
            } catch (error) {
                socket.emit('error', 'Failed to join room');
                logger.error(`Error joining room ${existingRoomId}:`, error);
            }
        } else {
            const roomId = uuidv4();
            try {
                await removeFromWaitingList(selectedGender, selectedCountry, waitingUserId);
                await saveRoom(roomId, waitingUserId, socket.id);

                socket.join(roomId);
                io.to(waitingUserId).emit('remote-socket', socket.id); 
                socket.emit('remote-socket', waitingUserId); 
                socket.emit('roomid', roomId);
                cb('p2');
            } catch (error) {
                socket.emit('error', 'Failed to create room');
                logger.error(`Error creating room ${roomId}:`, error);
            }
        }
    } else {
        const roomId = uuidv4();
        try {
            await saveRoom(roomId, socket.id, null);
            await addToWaitingList(selectedGender, selectedCountry, socket.id);
            socket.join(roomId);
            socket.emit('roomid', roomId);
            cb('p1');
        } catch (error) {
            socket.emit('error', 'Failed to create waiting room');
            logger.error(`Error creating waiting room ${roomId}:`, error);
        }
    }
}

async function handelDisconnect(disconnectedId, io) {
    const waitingKeys = await redis.keys('*:*');
    for (const key of waitingKeys) {
        if (key.includes(':') && !key.startsWith('room:')) {
            const [gender, country] = key.split(':');
            await removeFromWaitingList(gender, country, disconnectedId);
        }
    }

    const rooms = await redis.keys('room:*');
    for (const roomKey of rooms) {
        const room = await getRoom(roomKey.split(':')[1]);
        if (!room) continue;

        if (room.p1 === disconnectedId) {
            if (room.p2) {
                const p2Socket = io.sockets.sockets.get(room.p2);
                if (p2Socket && p2Socket.connected) {
                    io.to(room.p2).emit('disconnected');
                    await saveRoom(roomKey.split(':')[1], room.p2, null);
                } else {
                    await deleteRoom(roomKey.split(':')[1]);
                }
            } else {
                await deleteRoom(roomKey.split(':')[1]);
            }
            break;
        } else if (room.p2 === disconnectedId) {
            const p1Socket = io.sockets.sockets.get(room.p1);
            if (p1Socket && p1Socket.connected) {
                io.to(room.p1).emit('disconnected');
                await saveRoom(roomKey.split(':')[1], room.p1, null);
            } else {
                await deleteRoom(roomKey.split(':')[1]);
            }
            break;
        }
    }
}

async function getType(id) {
    const rooms = await redis.keys('room:*');
    for (const roomKey of rooms) {
        const room = await getRoom(roomKey.split(':')[1]);
        if (!room) continue;
        if (room.p1 === id) return { type: 'p1', p2id: room.p2 || null };
        if (room.p2 === id) return { type: 'p2', p1id: room.p1 };
    }
    return false;
}

module.exports = { handelStart, getType, handelDisconnect };