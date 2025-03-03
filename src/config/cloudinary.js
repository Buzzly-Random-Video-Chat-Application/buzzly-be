const cloudinary = require('cloudinary').v2;
const config = require('./config');

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

module.exports = {
  uploadImage,
};
