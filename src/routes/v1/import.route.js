const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { importValidation } = require('../../validations');
const { importController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(auth('manage'), validate(importValidation.createImport), importController.createImport)
  .get(auth('manage'), validate(importValidation.queryImports), importController.queryImports);

router
  .route('/:importId')
  .delete(auth('manage'), validate(importValidation.deleteImport), importController.deleteImport)
  .get(auth('manage'), validate(importValidation.getImport), importController.getImport);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Import management and retrieval
 */

/**
 * @swagger
 * /imports:
 *   post:
 *     summary: Create an import
 *     description: Create a new import. Requires authentication and create permission.
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileUrl
 *               - entryDate
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: The name of the file
 *               fileUrl:
 *                 type: string
 *                 description: The URL of the file
 *               entryDate:
 *                 type: string
 *                 description: The date of the import
 *             example:
 *               fileName: "blogs.csv"
 *               fileUrl: "https://example.com/blogs.csv"
 *               entryDate: "2021-01-01"
 *     responses:
 *       201:
 *         description: Import created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     entryDate:
 *                       type: string
 *                     author:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   get:
 *     summary: Get all imports
 *     description: Get all imports. Requires authentication and get permission.
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., createdAt:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of imports per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page number
 *     responses:
 *       200:
 *         description: Successfully retrieved all imports
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
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       fileUrl:
 *                         type: string
 *                       entryDate:
 *                         type: string
 *                       author:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *                 totalResults:
 *                   type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /imports/{importId}:
 *   get:
 *     summary: Get an import
 *     description: Get an import by ID. Requires authentication and get permission.
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the import to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the import
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     entryDate:
 *                       type: string
 *                     author:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete an import
 *     description: Delete an import by ID. Requires authentication and delete permission.
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the import to delete
 *     responses:
 *       200:
 *         description: Import deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Import:
 *       type: object
 *       properties:
 *         importId:
 *           type: string
 *           format: objectId
 *         fileName:
 *           type: string
 *         fileUrl:
 *           type: string
 *   responses:
 *     BadRequest:
 *       description: Bad request
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     Unauthorized:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     Forbidden:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     NotFound:
 *       description: Not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 */