const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const importSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error('Invalid file URL');
        }
      },
    },
    entryDate: {
      type: Date,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

importSchema.plugin(toJSON);
importSchema.plugin(paginate);

/**
 * Check if file name is taken
 * @param {string} fileName - The file name
 * @param {ObjectId} [excludeImportId] - The id of the import to be excluded
 * @returns {Promise<boolean>}
 */
importSchema.statics.isFileNameTaken = async function (fileName, excludeImportId) {
  const importModel = await this.findOne({ fileName, _id: { $ne: excludeImportId } });
  return !!importModel;
};

const Import = mongoose.model('Import', importSchema);

module.exports = Import;