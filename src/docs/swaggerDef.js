const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Buzzly API Documentation',
    version,
    description: 'API documentation for Buzzly backend, supporting authentication, user management, and more.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://buzzly-be.onrender.com/v1' : `http://localhost:${config.port}/v1`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Local development server',
    },
  ],
};

module.exports = swaggerDef;