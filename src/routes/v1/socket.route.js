const express = require('express');
const validate = require('../../middlewares/validate');
const { socketValidation } = require('../../validations');
const { socketController } = require('../../controllers');

const router = express.Router();

router.get('/', validate(socketValidation.socket), socketController.socket);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Socket
 *   description:
 */

/**
 * @swagger
 * /socket:
 *   get:
 *     summary: Get Socket.IO service status
 *     description: Retrieve the status of the Socket.IO service. No authentication required.
 *     tags: [Socket]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Status message
 *                 path:
 *                   type: string
 *                   description: The Socket.IO connection path
 *                 version:
 *                   type: string
 *                   description: API version
 *               example:
 *                 message: "Socket.IO service is available"
 *                 path: "/v1/socket"
 *                 version: "1.0.0"
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
