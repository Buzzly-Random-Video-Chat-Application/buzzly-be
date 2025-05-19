const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const livestreamSchema = new mongoose.Schema(
  {
    host: {
      userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
      },
      socketId: {
        type: String,
        required: true,
      },
    },
    livestreamName: {
      type: String,
      required: true,
      trim: true,
    },
    livestreamGreeting: {
      type: String,
      required: true,
      trim: true,
    },
    livestreamAnnouncement: {
      type: String,
      required: true,
      trim: true,
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

livestreamSchema.plugin(toJSON);
livestreamSchema.plugin(paginate);

/**
 * @typedef Livestream
 */
const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;
