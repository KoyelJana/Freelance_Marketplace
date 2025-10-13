const AboutModel = require("../../model/About");
const BannerModel = require("../../model/Banner");
const BidModel = require("../../model/Bid");
const ContactUsModel = require("../../model/Contact");
const FeatureModel = require("../../model/Feature");
const JobModel = require("../../model/Job");
const nodemailer=require('nodemailer')


class FrontendController {

    //home page
    async homePage(req, res) {
        const { skills, minBudget, maxBudget, status, postedDate } = req.query;

        let filter = {};

        // Filter by skills (array field)
        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by budget range
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }

        // Filter by posted date (jobs posted on or after this date)
        if (postedDate) {
            const date = new Date(postedDate);
            date.setHours(0, 0, 0, 0); // start of day
            filter.createdAt = { $gte: date };
        }

        try {
            const jobs = await JobModel.find(filter).sort({ createdAt: -1 });

            const banner = await BannerModel.findOne();

            const about = await AboutModel.findOne();

            const features= await FeatureModel.find();

            res.render("frontend/home", {
                activePage: "home",
                jobs,
                banner,
                about,
                features,
                title: 'WorkNestly',
                query: req.query // for pre-filling filters
            });
        } catch (err) {
            console.error("Error fetching jobs:", err);
            res.render("frontend/home", {
                activePage: "home",
                jobs: [],
                title: 'WorkNestly',
                query: req.query,
                error: "Failed to fetch jobs"
            });
        }
    }

    //about page
    async aboutPage(req, res) {
        try {
            const about = await AboutModel.findOne();

            res.render("frontend/about", {
                about,
                title: 'About',
                activePage: "about"
            })
        }
        catch (error) {
            console.log(error);

        }
    }

    //features page
    async feturesPage(req, res) {
        try {
            const features = await FeatureModel.find();

            res.render("frontend/fetures", {
                features,
                title: 'Feature',
                activePage: "features"
            })
        }
        catch (error) {
            console.log(error);

        }
    }

    //Job Board Pge
    async jobBoardPage(req, res) {
        const { skills, minBudget, maxBudget, status, postedDate } = req.query;

        let filter = {};

        // Filter by skills (array field)
        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by budget range
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }

        // Filter by posted date (jobs posted on or after this date)
        if (postedDate) {
            const date = new Date(postedDate);
            date.setHours(0, 0, 0, 0); // start of day
            filter.createdAt = { $gte: date };
        }

        try {
            const jobs = await JobModel.find(filter).sort({ createdAt: -1 });

            res.render("frontend/jobBoard", {
                activePage: "jobBoard",
                jobs,
                title: 'Job_Board',
                query: req.query // for pre-filling filters
            });
        } catch (err) {
            console.error("Error fetching jobs:", err);
            res.render("frontend/jobBoard", {
                activePage: "jobBoard",
                jobs: [],
                title: 'Job_Board',
                query: req.query,
                error: "Failed to fetch jobs"
            });
        }
    }

    // Job detail page
    async jobDetail(req, res) {
        try {
            const jobId = req.params.id;
            const job = await JobModel.findById(jobId);

            if (!job) {
                return res.status(404).send("Job not found");
            }

            const bids = await BidModel.find({ jobId }).populate("freelancerId");

            res.render("frontend/Job_details", {
                activePage: "jobDetails",
                message: req.flash("message"),
                job,
                bids,
                title: `Job Details - ${job.title}`
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    }
    //contact page
    async contactPage(req, res) {
        try {
            res.render("frontend/Contact_Us", {
                activePage: "contact",
                message: req.flash("message"),
                title: 'Contact Us'
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    }

    async createContactUs(req, res) {
        try {
            const { name, email, message } = req.body;

            // Save to DB
            const newContact = new ContactUsModel({ name, email, message });
            await newContact.save();

            // Send mail to owner
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

            req.flash("message", "Your message has been sent successfully!");
            res.redirect("/contact");
        } catch (error) {
            console.error(error);
            req.flash("message", "Something went wrong, please try again!");
            res.redirect("/contact");
        }

    }


}

module.exports = new FrontendController()