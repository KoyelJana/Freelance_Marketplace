const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: [{ type: String, required: true }],
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["open", "in_progress", "completed", "closed"], default: "open" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const JobModel = mongoose.model("job", JobSchema);
module.exports = JobModel;
