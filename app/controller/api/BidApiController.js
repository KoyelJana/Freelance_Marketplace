const BidModel = require("../../model/Bid");
const JobModel = require("../../model/Job");
const Message = require("../../model/Message");

class BidApiController {
  // Submit a new bid (API version)
  async submitBid(req, res) {
    try {
      const { proposal, amount, deliveryDays } = req.body;
      const { jobId } = req.params;

      // Validate freelancer authentication (from JWT middleware)
      if (!req.freelancer || !req.freelancer._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please login as freelancer.",
        });
      }

      // Check if job exists
      const job = await JobModel.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found.",
        });
      }

      // Prevent bidding on in-progress jobs
      if (job.status === "in_progress") {
        return res.status(400).json({
          success: false,
          message: "This job is already in progress. You cannot submit a bid.",
        });
      }

      // Create bid
      const bid = await BidModel.create({
        jobId,
        freelancerId: req.freelancer._id,
        proposal,
        amount,
        deliveryDays,
        freelancerName: req.freelancer.name,
        status: "pending",
        createdAt: new Date(),
      });

      // If proposal message exists, create a message for the client
      if (proposal && proposal.trim() !== "") {
        const message = await Message.create({
          jobId,
          senderId: req.freelancer._id,
          receiverId: job.clientId,
          message: proposal,
          status: "sent",
        });

        // Emit message via Socket.io
        const { io } = require("../../../app");
        io.to(jobId.toString()).emit("receiveMessage", {
          _id: message._id,
          jobId,
          senderId: req.freelancer._id,
          receiverId: job.clientId,
          message: message.message,
          status: "delivered",
          createdAt: message.createdAt,
        });
      }

      // Success response
      return res.status(200).json({
        success: true,
        message: "Your bid has been submitted successfully!",
        data: bid,
      });
    } catch (err) {
      console.error("Error submitting bid:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to submit bid. Please try again later.",
      });
    }
  }
}

module.exports = new BidApiController();
