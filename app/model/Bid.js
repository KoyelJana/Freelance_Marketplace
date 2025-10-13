const mongoose = require("mongoose");

const BidSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "job", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    proposal: { type: String, required: true },
    amount: { type: Number, required: true },
    deliveryDays: { type: Number, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    freelancerName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    approvedAt: { type: Date }
}, { timestamps: true });

const BidModel = mongoose.model("bid", BidSchema);
module.exports = BidModel;