const express = require("express");
const JobApiController = require("../../controller/api/JobApiController");
const clientAuthApi = require("../../middleware/clientAuthApi");
const Image = require("../../helper/Image");
const router = express.Router();

// JOB CRUD
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs (with optional filters)
 *     tags: [Job]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Filter jobs by skill
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *         description: Minimum job budget
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *         description: Maximum job budget
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, completed, closed]
 *         description: Filter by job status
 *     responses:
 *       200:
 *         description: List of jobs fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", clientAuthApi, JobApiController.list);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Job]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", clientAuthApi, JobApiController.details);

/**
 * @swagger
 * /api/jobs/create:
 *   post:
 *     summary: Create a new job
 *     tags: [Job]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - skills
 *               - budget
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 example: Web Developer Needed
 *               description:
 *                 type: string
 *                 example: Need a Node.js developer to build REST APIs
 *               skills:
 *                 type: string
 *                 example: node.js, express, mongodb
 *               budget:
 *                 type: number
 *                 example: 500
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2025-10-25
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", clientAuthApi, Image.single("image"), JobApiController.create);

/**
 * @swagger
 * /api/jobs/update/{id}:
 *   put:
 *     summary: Update an existing job
 *     tags: [Job]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Job Title
 *               description:
 *                 type: string
 *                 example: Updated job description
 *               skills:
 *                 type: string
 *                 example: node.js, express
 *               budget:
 *                 type: number
 *                 example: 600
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-01
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, completed, closed]
 *                 example: in_progress
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.put("/update/:id", clientAuthApi, Image.single("image"), JobApiController.update);

/**
 * @swagger
 * /api/jobs/delete/{id}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Job]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.delete("/delete/:id", clientAuthApi, JobApiController.delete);

module.exports = router;
