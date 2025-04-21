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
      url: '/v1/docs',
      defaultModelsExpandDepth: -1,  
      docExpansion: 'none',  
      tryItOutEnabled: true,  
      requestInterceptor: (req) => {
        console.log(`Swagger request: ${req.method} ${req.url}`);
        return req;
      },
    },
  })
);

module.exports = router;