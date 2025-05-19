const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const connectionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    p1UserId: {
      type: String,
      required: true,
    },
    p2UserId: {
      type: String,
      required: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

connectionSchema.plugin(toJSON);
connectionSchema.plugin(paginate);

/**
 * @typedef Connection
 */
const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
