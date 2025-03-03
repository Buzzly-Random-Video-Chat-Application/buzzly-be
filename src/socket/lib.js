/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
const { v4: uuidv4 } = require('uuid');

function handelStart(roomArr, socket, cb, io) {
  // check available rooms
  // eslint-disable-next-line no-use-before-define
  const availableroom = checkAvailableRoom();
  if (availableroom.is) {
    socket.join(availableroom.roomid);
    cb('p2');

    setTimeout(() => {
      if (!availableroom.room.p2.id) {
        roomArr.splice(roomArr.indexOf(availableroom.room), 1);
        io.to(availableroom.room.p1.id).emit('disconnected');
      }
    }, 10000);

    // eslint-disable-next-line no-use-before-define
    closeRoom(availableroom.roomid);
    if (availableroom.room) {
      io.to(availableroom.room.p1.id).emit('remote-socket', socket.id);
      socket.emit('remote-socket', availableroom.room.p1.id);
      socket.emit('roomid', availableroom.room.roomid);
    }
  }
  // if no available room, create one
  else {
    const roomid = uuidv4();
    socket.join(roomid);
    roomArr.push({
      roomid,
      isAvailable: true,
      p1: {
        id: socket.id,
      },
      p2: {
        id: null,
      },
    });
    cb('p1');
    socket.emit('roomid', roomid);
  }

  function closeRoom(roomid) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < roomArr.length; i++) {
      if (roomArr[i].roomid == roomid) {
        roomArr[i].isAvailable = false;
        roomArr[i].p2.id = socket.id;
        break;
      }
    }
  }

  function checkAvailableRoom() {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < roomArr.length; i++) {
      if (roomArr[i].isAvailable) {
        return { is: true, roomid: roomArr[i].roomid, room: roomArr[i] };
      }
      if (roomArr[i].p1.id == socket.id || roomArr[i].p2.id == socket.id) {
        return { is: false, roomid: '', room: null };
      }
    }
    return { is: false, roomid: '', room: null };
  }
}

function handelDisconnect(disconnectedId, roomArr, io) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < roomArr.length; i++) {
    if (roomArr[i].p1.id == disconnectedId) {
      io.to(roomArr[i].p2.id).emit('disconnected');
      if (roomArr[i].p2.id) {
        roomArr[i].isAvailable = true;
        roomArr[i].p1.id = roomArr[i].p2.id;
        roomArr[i].p2.id = null;
      } else {
        roomArr.splice(i, 1);
      }
    } else if (roomArr[i].p2.id == disconnectedId) {
      io.to(roomArr[i].p1.id).emit('disconnected');
      if (roomArr[i].p1.id) {
        roomArr[i].isAvailable = true;
        roomArr[i].p2.id = null;
      } else {
        roomArr.splice(i, 1);
      }
    }
  }
}

function getType(id, roomArr) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < roomArr.length; i++) {
    // eslint-disable-next-line eqeqeq
    if (roomArr[i].p1.id == id) {
      return { type: 'p1', p2id: roomArr[i].p2.id };
    }
    // eslint-disable-next-line eqeqeq
    if (roomArr[i].p2.id == id) {
      return { type: 'p2', p1id: roomArr[i].p1.id };
    }
  }
  return false;
}

module.exports = { handelStart, handelDisconnect, getType };
