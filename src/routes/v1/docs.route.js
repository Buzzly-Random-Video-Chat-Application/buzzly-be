const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = require('../../docs/swaggerDef');

const router = express.Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['./src/docs/*.yml', './src/routes/v1/*.js'],
});

// Serve Swagger JSON
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Redirect /v1/docs to /v1/docs/
router.get('', (req, res) => {
  res.redirect('/v1/docs/');
});

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      url: '/v1/docs/json',
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

// const express = require('express');
// const swaggerJsdoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');
// const swaggerDefinition = require('../../docs/swaggerDef');

// const router = express.Router();

// const specs = swaggerJsdoc({
//   swaggerDefinition,
//   apis: ['src/docs/*.yml', 'src/routes/v1/*.js'],
// });

// router.use('/', swaggerUi.serve);
// router.get(
//   '/',
//   swaggerUi.setup(specs, {
//     explorer: true,
//     swaggerOptions: {
//       url: '/v1/docs',
//       defaultModelsExpandDepth: -1,  
//       docExpansion: 'none',  
//       tryItOutEnabled: true,  
//       requestInterceptor: (req) => {
//         console.log(`Swagger request: ${req.method} ${req.url}`);
//         return req;
//       },
//     },
//   })
// );

// module.exports = router;