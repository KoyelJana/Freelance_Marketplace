const BidModel = require("../../model/Bid");
const JobModel = require("../../model/Job");
const Message = require("../../model/Message");

class BidController {
    // Submit a new bid
    async submitBid(req, res) {
        try {
            const { proposal, amount, deliveryDays } = req.body;
        const jobId = req.params.jobId;

        if (!req.session.freelancer) {
            req.flash("message", "You must be logged in as freelancer to bid.");
            return res.redirect('/login');
        }

        // Check if job exists and status is not in_progress
        const job = await JobModel.findById(jobId);
        if (!job) {
            req.flash("message", "Job not found");
            return res.redirect('/');
        }

        if (job.status === "in_progress") {
            req.flash("message", "This job is already in progress. You cannot submit a bid.");
            return res.redirect(`/job/${jobId}`);
        }

        //Create the bid
        const bid = await BidModel.create({
            jobId,
            freelancerId: req.session.freelancer._id,
            proposal,
            amount,
            deliveryDays,
            freelancerName: req.session.freelancer.name,
            status: "pending",
            createdAt: new Date()
        });

        //If proposal/message is provided, create Message for client
        if (proposal && proposal.trim() !== "") {
            const message = await Message.create({
                jobId,
                senderId: req.session.freelancer._id,
                receiverId: job.clientId,  // send to client
                message: proposal,
                status: "sent"
            });

            //Emit live message to client via Socket.io
            const { io } = require("../../../app"); // import io from app.js
            io.to(jobId.toString()).emit("receiveMessage", {
                _id: message._id,
                jobId,
                senderId: req.session.freelancer._id,
                receiverId: job.clientId,
                message: message.message,
                status: "delivered",
                createdAt: message.createdAt
            });
        }

        req.flash("message", "Your bid has been submitted successfully!");
        res.redirect('/');
        } catch (err) {
            console.error("Error submitting bid:", err);
            req.flash("message", "Failed to submit bid");
            res.redirect(`/job/${req.params.jobId}`);
        }
    }



}

module.exports = new BidController();
