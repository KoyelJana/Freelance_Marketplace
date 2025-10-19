const express = require("express");
const freelancerAuthApi = require("../../middleware/freelancerAuthApi");
const BidApiController = require("../../controller/api/BidApiController");
const router = express.Router();


/** 
   * @swagger
   * /api/bids/submit/{jobId}:
   *   post:
   *     summary: Submit a new bid for a job
   *     description: Allows a freelancer to submit a bid for a specific job.
   *     tags: [Bid]
   *     security:
   *       - freelancerAuth: []
   *     parameters:
   *       - name: jobId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the job to bid on
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               proposal:
   *                 type: string
   *                 example: I can deliver this project within 7 days.
   *               amount:
   *                 type: number
   *                 example: 500
   *               deliveryDays:
   *                 type: number
   *                 example: 7
   *     responses:
   *       200:
   *         description: Bid submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 bid:
   *                   $ref: '#/components/schemas/Bid'
   *       400:
   *         description: Invalid input or job not found
   *       401:
   *         description: Unauthorized access
   *       500:
   *         description: Server error
   */
// Submit bid (freelancer)
router.post("/submit/:jobId",freelancerAuthApi, BidApiController.submitBid);

module.exports = router;
