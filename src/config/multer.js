const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
