const cloudinary = require('cloudinary').v2;
const config = require('./config');
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer || fileBuffer.length === 0) {
      return reject(new Error('File buffer is empty'));
    }

    const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) {
        reject(new Error('Cloudinary upload failed'));
      } else {
        resolve(result);
      }
    });

    stream.end(fileBuffer);
  });
};

const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'raw',
        format: file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' : 'xls',
        public_id: `${Date.now()}_${file.originalname}`,
        resource_type: 'raw'
      },
      (error, result) => {
        if (error) {
          reject(new Error('Cloudinary upload failed'));
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
};

module.exports = {
  uploadImage,
  uploadFile,
};
