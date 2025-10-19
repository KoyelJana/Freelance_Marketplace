const AboutModel = require("../../model/About");
const BannerModel = require("../../model/Banner");
const BidModel = require("../../model/Bid");
const ContactUsModel = require("../../model/Contact");
const FeatureModel = require("../../model/Feature");
const JobModel = require("../../model/Job");
const nodemailer = require('nodemailer');

class FrontendApiController {

    // Home Page API
    async homePage(req, res) {
        const { skills, minBudget, maxBudget, status, postedDate } = req.query;
        let filter = {};

        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }
        if (status) filter.status = status;
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }
        if (postedDate) {
            const date = new Date(postedDate);
            date.setHours(0, 0, 0, 0);
            filter.createdAt = { $gte: date };
        }

        try {
            const jobs = await JobModel.find(filter).sort({ createdAt: -1 });
            const banner = await BannerModel.findOne();
            const about = await AboutModel.findOne();
            const features = await FeatureModel.find();

            res.json({
                success: true,
                data: { jobs, banner, about, features },
                query: req.query
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to fetch jobs" });
        }
    }

    // About Page API
    async aboutPage(req, res) {
        try {
            const about = await AboutModel.findOne();
            res.json({ success: true, data: about });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to fetch about info" });
        }
    }

    // Features Page API
    async featuresPage(req, res) {
        try {
            const features = await FeatureModel.find();
            res.json({ success: true, data: features });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to fetch features" });
        }
    }

    // Job Board API
    async jobBoardPage(req, res) {
        const { skills, minBudget, maxBudget, status, postedDate } = req.query;
        let filter = {};

        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }
        if (status) filter.status = status;
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }
        if (postedDate) {
            const date = new Date(postedDate);
            date.setHours(0, 0, 0, 0);
            filter.createdAt = { $gte: date };
        }

        try {
            const jobs = await JobModel.find(filter).sort({ createdAt: -1 });
            res.json({ success: true, data: jobs, query: req.query });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to fetch jobs" });
        }
    }

    // Job Detail API
    async jobDetail(req, res) {
        try {
            const jobId = req.params.id;
            const job = await JobModel.findById(jobId);
            if (!job) return res.status(404).json({ success: false, message: "Job not found" });

            const bids = await BidModel.find({ jobId }).populate("freelancerId");

            res.json({ success: true, data: { job, bids } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    // Contact Page API
    async contactPage(req, res) {
        res.json({ success: true, message: "Contact page endpoint" });
    }

    // Create Contact API
    async createContactUs(req, res) {
        try {
            const { name, email, message } = req.body;

            const newContact = new ContactUsModel({ name, email, message });
            await newContact.save();

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_FROM,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: email,
                to: process.env.EMAIL_FROM,
                subject: "New Contact Us Message",
                html: `<h3>New Contact Message</h3>
                       <p><b>Name:</b> ${name}</p>
                       <p><b>Email:</b> ${email}</p>
                       <p><b>Message:</b> ${message}</p>`,
            };

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: "Message sent successfully!" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to send message" });
        }
    }
}

module.exports = new FrontendApiController();
