const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { livestreamValidation } = require('../../validations');
const { livestreamController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(auth('create'), validate(livestreamValidation.createLivestream), livestreamController.createLivestream)
  .get(auth('get'), validate(livestreamValidation.queryLivestreams), livestreamController.queryLivestreams);

router
  .route('/:livestreamId')
  .get(auth('get'), validate(livestreamValidation.getLivestream), livestreamController.getLivestream)
  .patch(auth('update'), validate(livestreamValidation.updateLivestream), livestreamController.updateLivestream)
  .delete(auth('delete'), validate(livestreamValidation.deleteLivestream), livestreamController.deleteLivestream);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Livestreams
 *   description: APIs for managing livestream rooms
 */

/**
 * @swagger
 * /livestreams:
 *   post:
 *     summary: Create a new livestream
 *     description: Create a livestream room. Only authenticated users can create a livestream. The livestreamId is automatically generated.
 *     tags: [Livestreams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - livestreamName
 *               - host
 *             properties:
 *               livestreamName:
 *                 type: string
 *               livestreamGreeting:
 *                 type: string
 *               livestreamAnnouncement:
 *                 type: string
 *               host:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   socketId:
 *                     type: string
 *             example:
 *               livestreamName: "My Live Show"
 *               livestreamGreeting: "Welcome to my stream!"
 *               livestreamAnnouncement: "We'll start at 8 PM"
 *               host:
 *                 userId: "507f1f77bcf86cd799439011"
 *                 socketId: "abc123"
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Livestream'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get a list of livestreams
 *     description: Retrieve a paginated list of livestreams based on filters.
 *     tags: [Livestreams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isLive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
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
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livestream'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /livestreams/{livestreamId}:
 *   get:
 *     summary: Get a livestream by ID
 *     description: Retrieve details of a specific livestream by its ID.
 *     tags: [Livestreams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: livestreamId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
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
 *                 result:
 *                   $ref: '#/components/schemas/Livestream'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a livestream
 *     description: Update a livestream's details. Only the host can update.
 *     tags: [Livestreams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: livestreamId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               livestreamName:
 *                 type: string
 *               livestreamGreeting:
 *                 type: string
 *               livestreamAnnouncement:
 *                 type: string
 *               isLive:
 *                 type: boolean
 *             example:
 *               livestreamName: "Updated Live Show"
 *               livestreamGreeting: "New greeting!"
 *               isLive: false
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
 *                 result:
 *                   $ref: '#/components/schemas/Livestream'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a livestream
 *     description: Delete a livestream. Only the host can delete.
 *     tags: [Livestreams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: livestreamId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
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
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Livestream:
 *       type: object
 *       properties:
 *         livestreamId:
 *           type: string
 *           format: objectId
 *         livestreamName:
 *           type: string
 *         livestreamGreeting:
 *           type: string
 *         livestreamAnnouncement:
 *           type: string
 *         host:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             socketId:
 *               type: string
 *         isLive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
