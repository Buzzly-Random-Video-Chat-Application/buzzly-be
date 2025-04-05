const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = require('../../docs/swaggerDef');

const router = express.Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.js'],
});

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      url: '/v1/docs', // Định nghĩa URL gốc cho Swagger
      defaultModelsExpandDepth: -1, // Tắt mở rộng model mặc định
      docExpansion: 'none', // Thu gọn tài liệu mặc định
      tryItOutEnabled: true, // Giữ khả năng thử API
      requestInterceptor: (req) => {
        console.log(`Swagger request: ${req.method} ${req.url}`); // Log request từ Swagger
        return req;
      },
    },
  })
);

module.exports = router;