const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Validator } = require('node-input-validator');
const UserModel = require('../../model/User');
const sendEmailVerificationOTP = require('../../helper/SendMail');
const EmailVerificationModel = require('../../model/otpModel');
const transporter = require('../../config/emailConfig');
const fs = require("fs");
const path = require("path");
const JobModel = require('../../model/Job');
const BidModel = require('../../model/Bid');
const ContactUsModel = require('../../model/Contact');
const AboutModel = require('../../model/About');
const Message = require('../../model/Message');
const BannerModel = require('../../model/Banner');
const Feature=require('../../model/Feature')

class ClientController {

    //Client register form
    async ClientRegister(req, res) {
        try {
            res.render('client/Client_register', { // Renders views/client/Client_register.ejs
                title: 'Client Register Page',
                message: req.flash('message')
            });
        } catch (error) {
            console.error(error);
        }
    }

    //create Client register
    async ClientRegisterCreate(req, res) {
        try {
            const v = new Validator(req.body, {
                name: "required|string",
                email: "required|email",
                phone: "required|string|minLength:10|maxLength:10",
                password: "required|string|minLength:6"
            });

            const matched = await v.check();
            if (!matched) {
                return res.status(400).json({
                    success: false,
                    message: v.errors   // frontend will parse this
                });
            }

            const { name, email, phone, password } = req.body;

            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            const user = await UserModel.create({
                name,
                email,
                phone,
                password: hashPassword
            });

            sendEmailVerificationOTP(req, user);

            if (user) {
                return res.status(200).json({
                    success: true,
                    message: "User data created successfully",
                    redirectUrl: "/client/verify_otp"
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to register"
                });
            }

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }


    //verify otp form
    async verifiotpForm(req, res) {
        try {
            res.render('client/Client_verify_Otp', {
                title: 'Client verify otp page',
                message: req.flash('message')
            });
        } catch (error) {
            console.error(error);
        }
    }

    //email verified
    async verifiotp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                req.flash('message', "All field are required")
                return res.redirect('/client/verify_otp')
            }
            const existingUser = await UserModel.findOne({ email });

            if (!existingUser) {
                req.flash('message', "Email does't exists")
                return res.redirect('/client/verify_otp')
            }

            if (existingUser.is_verified) {
                req.flash('message', "Email is already verified")
                return res.redirect('/client/verify_otp')
            }

            const emailVerification = await EmailVerificationModel.findOne({ userId: existingUser._id, otp });
            if (!emailVerification) {
                if (!existingUser.is_verified) {
                    await sendEmailVerificationOTP(req, existingUser);
                    req.flash('message', "Invalid OTP, new OTP sent to your email")
                    return res.redirect('/client/verify_otp')
                }
                req.flash('message', "Invalid OTP")
                return res.redirect('/client/verify_otp')
            }

            const currentTime = new Date();
            const expirationTime = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
            if (currentTime > expirationTime) {
                await sendEmailVerificationOTP(req, existingUser);
                req.flash('message', "OTP expired, new OTP sent to your email")
                return res.redirect('/client/verify_otp')
            }

            existingUser.is_verified = true;
            await existingUser.save();

            await EmailVerificationModel.deleteMany({ userId: existingUser._id });
            req.flash('message', "Email verified successfully")
            return res.redirect('/client/login')

        } catch (error) {
            console.error(error);
        }
    }

    //Client login form
    async ClientLogin(req, res) {
        try {
            res.render('client/Client_login', {
                title: 'Client login Page',
                message: req.flash('message')
            });
        } catch (error) {
            console.error(error);
        }
    }

    //create Client login
    async ClientLoginCreate(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

            const user = await UserModel.findOne({ email });
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

            if (!user.is_verified) return res.status(403).json({ success: false, message: "Email is not verified" });
            if (user.role !== "client") return res.status(403).json({ success: false, message: "You are not a client" });

            const token = jwt.sign(
                { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, skills: user.skills },
                "clientlogineuieioewhre",
                { expiresIn: "30d" }
            );

            res.cookie("clientToken", token, { httpOnly: true });
            return res.status(200).json({ success: true, message: "Login successful", redirectUrl: "/client/dashboard" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }


    //forgot password link form
    async forgotPasswordLinkForm(req, res) {
        try {
            res.render('client/Client_ForgotPassword_link', {
                title: 'Client Forgot Password link',
                message: req.flash('message')
            });
        } catch (error) {
            console.error(error);
        }
    }

    //reset password link
    async forgotPasswordLink(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                req.flash('message', "Email field is required")
                return res.redirect('/client/forgot_password_link')
            }
            const user = await UserModel.findOne({ email });
            if (!user) {
                req.flash('message', "Email doesn't exist")
                return res.redirect('/client/forgot_password_link')
            }
            const secret = user._id + process.env.JWT_SECRET_KEY;
            const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '20m' });
            const resetLink = `http://${req.headers.host}/client/reset_password/${user.id}/${token}`;

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password.</p>`
            });

            req.flash('message', "Password reset link send your email. Please check your email.")
            return res.redirect('/client/login')

        } catch (error) {
            console.log(error);
        }
    }

    //reset password form
    async resetPasswordForm(req, res) {
        try {
            const { id, token } = req.params;
            const user = await UserModel.findById(id);

            if (!user) {
                console.log("Invalid or expired password reset link.");
            }

            const secret = process.env.JWT_SECRET + user.password;
            jwt.verify(token, secret, (err, decoded) => {
                if (err) {
                    console.log("Invalid or expired password reset link.");
                }

                res.render('client/Client_reset_password', {
                    userId: id,
                    token: token,
                    message: null,
                    title: 'Client Reset Password'
                });
            });
        } catch (error) {
            console.error(error);
        }
    }

    //reset password
    async resetPassword(req, res) {
        try {
            const { id, token } = req.params;
            const { password, confirm_password } = req.body;

            const user = await UserModel.findById(id);
            if (!user) {
                return res.render('client/Client_reset_password', {
                    userId: id,
                    token: token,
                    message: "Invalid password reset link."
                });
            }

            const new_secret = user._id + process.env.JWT_SECRET_KEY;
            try {
                jwt.verify(token, new_secret);
            } catch (jwtError) {
                console.error('JWT Verification Error:', jwtError.message);
                return res.render('client/Client_reset_password', {
                    userId: id,
                    token: token,
                    message: "Password reset link is invalid or has expired."
                });
            }

            if (!password || !confirm_password) {
                return res.render('client/Client_reset_password', {
                    userId: id,
                    token: token,
                    message: "New Password and Confirm New Password are required."
                });
            }
            if (password !== confirm_password) {
                return res.render('client/Client_reset_password', {
                    userId: id,
                    token: token,
                    message: "Passwords do not match."
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            req.flash('message', "Your password reset successfully")
            return res.redirect('/client/login');

        } catch (error) {
            console.error('An unexpected error occurred:', error);
            return res.render('client/Client_reset_password', {
                userId: req.params.id,
                token: req.params.token,
                message: "Unable to reset password. Please try again later."
            });
        }
    }

    //Client Dashboard
    async Clientdashboard(req, res) {
        try {
            const userId = req.user._id;

            const jobCounts = {
                total: await JobModel.countDocuments({ clientId: userId }),
                open: await JobModel.countDocuments({ clientId: userId, status: 'open' }),
                inProgress: await JobModel.countDocuments({ clientId: userId, status: 'in_progress' }),
                completed: await JobModel.countDocuments({ clientId: userId, status: 'completed' }),
                closed: await JobModel.countDocuments({ clientId: userId, status: 'closed' }),
            };

            const bidCounts = {
                pending: await BidModel.countDocuments({ status: 'pending' }),
                accepted: await BidModel.countDocuments({ status: 'accepted' }),
                rejected: await BidModel.countDocuments({ status: 'rejected' }),
            };

            res.render('client/Client_dashboard', { title: "client_dashboard", user: req.user, jobCounts, bidCounts });
        } catch (error) {
            console.error(error);
        }
    }

    // GET Profile (by ID or self)
    async getProfile(req, res) {
        try {
            const client = await UserModel.findById(req.user._id);
            if (!client) return res.status(404).send("Client not found");

            res.render("client/Client_profile", { title: "Client Profile", client, user: req.user, message: req.flash("message") });
        } catch (error) {
            console.error(error);
            res.status(500).send("Server Error");
        }
    }

    /** Edit Profile */
    async editClient(req, res) {
        try {
            const client = await UserModel.findById(req.params.id);
            if (client) {
                return res.render("client/Edit_Client", {
                    title: "Edit Client Profile",
                    activePage: "Edit_Client",
                    user: req.user,
                    message: req.flash("message"),
                    client,
                });
            }
            req.flash("message", "Client not found.");
            return res.redirect("/client/dashboard");
        } catch (error) {
            console.error("Edit Client Error:", error);
            req.flash("message", "Something went wrong.");
            return res.redirect("/client/dashboard");
        }
    }

    /** Update Profile with Avatar Upload */
    async updateClient(req, res) {
        try {
            const id = req.params.id;
            const { name, phone, bio, skills } = req.body;
            let updateData = {
                name,
                phone,
                bio,
                skills: skills ? skills.split(",").map((s) => s.trim()) : [],
            };

            // if avatar uploaded
            if (req.file) {
                updateData.avatar = "/uploads/" + req.file.filename;
            }

            const updatedClient = await UserModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedClient) {
                req.flash("message", "Profile updated successfully.");
                return res.redirect("/client/profile");
            }

            req.flash("message", "Client not found.");
            return res.redirect("/client/edit/" + id);
        } catch (error) {
            console.error("Update Client Error:", error);
            req.flash("message", "Something went wrong.");
            return res.redirect("/client/profile");
        }
    }

    //logout
    async ClientLogout(req, res) {
        res.clearCookie('clientToken')
        res.redirect('/client/login')
    }


    //manage bid\\
    // View all bids for a job (for client)
    async jobBids(req, res) {
        try {
            const jobId = req.params.jobId;
            const job = await JobModel.findById(jobId);
            const bids = await BidModel.find({ jobId })
                .populate("freelancerId", "name email");

            res.render("client/job-bids", {
                title: "Job Bids",
                job,
                bids,
                message: req.flash("message")
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    }

    // Show all bids grouped by status
    async getAllBids(req, res) {
        try {
            const pendingBids = await BidModel.find({ status: "pending" }).sort({ createdAt: -1 });
            const acceptedBids = await BidModel.find({ status: "accepted" }).sort({ createdAt: -1 });
            const rejectedBids = await BidModel.find({ status: "rejected" }).sort({ createdAt: -1 });

            res.render("client/Client_all_bids", {
                title: "All Bids",
                pendingBids,
                acceptedBids,
                rejectedBids,
                message: req.flash("message"),
                user: req.user
            });
        } catch (error) {
            console.error("Error fetching bids:", error);
            req.flash("message", "Error fetching bids");
            res.redirect("/admin/dashboard");
        }
    }

    // Accept a bid
    async acceptBid(req, res) {
        try {
            const bidId = req.params.id;

            // Find the bid
            const bid = await BidModel.findById(bidId);
            if (!bid) {
                req.flash("message", "Bid not found");
                return res.redirect("/client/all_bids");
            }

            //Update this bid to accepted
            await BidModel.findByIdAndUpdate(bidId, { status: "accepted" });

            //Update related job to in_progress
            await JobModel.findByIdAndUpdate(bid.jobId, { status: "in_progress" });

            //Reject all other pending bids for the same job
            await BidModel.updateMany(
                { jobId: bid.jobId, _id: { $ne: bid._id }, status: "pending" },
                { $set: { status: "rejected" } }
            );

            const job = await JobModel.findById(bid.jobId);

            //Create an automatic message to freelancer
            const messageContent = `Your bid for "${job.title}" has been accepted by the client!`;

            const message = await Message.create({
                jobId: job._id,
                senderId: req.user._id,      // client
                receiverId: bid.freelancerId,        // freelancer
                message: messageContent,
                status: "sent"
            });

            //Emit live message to freelancer via Socket.io
            const { io } = require("../../../app"); // import io from app.js
            io.to(job._id.toString()).emit("receiveMessage", {
                _id: message._id,
                jobId: job._id,
                senderId: req.user._id,
                receiverId: bid.freelancerId,
                message: message.message,
                status: "delivered",
                createdAt: message.createdAt
            });

            req.flash("message", "Bid accepted successfully, job moved to in_progress, other bids rejected.");
            res.redirect("/client/all_bids");
        } catch (error) {
            console.error("Error accepting bid:", error);
            req.flash("message", "Error accepting bid");
            res.redirect("/client/all_bids");
        }
    } 

    // Reject a bid
    async rejectBid(req, res) {
        try {
            const bidId = req.params.bidId;

            await BidModel.findByIdAndUpdate(bidId, { status: "rejected" });

            req.flash("message", "Bid rejected successfully!");
            res.redirect("/client/all_bids");
        } catch (err) {
            console.error(err);
            req.flash("message", "Failed to reject bid");
            res.redirect("/client/all_bids");
        }
    }


    //banner Section\\
    async BannerList(req, res) {
        const banners = await BannerModel.find();
        res.render("client/Banner_list", {
            title: "All Banner",
            banners,
            user: req.user
        });
    }
    async addBannerForm(req, res) {
        res.render("client/Banner_add", {
            title: "Add Banner",
            user: req.user
        });
    }
    async createBanner(req, res) {
        const data = req.body;
        if (req.file) data.image = "/uploads/" + req.file.filename;
        await BannerModel.create(data);
        res.redirect("/client/banner");
    }
    async editBannerForm(req, res) {
        const banner = await BannerModel.findById(req.params.id);
        res.render("client/Banner_edit", {
            title: "Edit Banner",
            banner,
            user: req.user
        });
    }
    async updateBanner(req, res) {
        try {
            const banner = await BannerModel.findById(req.params.id);
            if (!banner) {
                req.flash("error", "Banner not found");
                return res.redirect("/client/banner");
            }

            // Handle new file upload
            if (req.file) {
                // Delete old image if exists
                if (banner.image) {
                    const oldPath = path.join(__dirname, "../../uploads", path.basename(banner.image));
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                // Save new image path
                req.body.image = "/uploads/" + req.file.filename;
            }

            await BannerModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            req.flash("success", "Banner updated successfully!");
            res.redirect("/client/banner");
        } catch (err) {
            console.error(err);
            req.flash("error", "Something went wrong while updating!");
            res.redirect("/client/banner");
        }
    }

    async deleteBanner(req, res) {
        try {
            const banner = await BannerModel.findById(req.params.id);
            if (!banner) {
                req.flash("error", "Banner not found");
                return res.redirect("/client/banner");
            }

            // Delete image if exists
            if (banner.image) {
                const oldPath = path.join(__dirname, "../../uploads", path.basename(banner.image));
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            await BannerModel.findByIdAndDelete(req.params.id);
            req.flash("success", "Banner deleted successfully!");
            res.redirect("/client/banner");
        } catch (err) {
            console.error(err);
            req.flash("error", "Something went wrong while deleting!");
            res.redirect("/client/banner");
        }
    }


    //adout Section\\
    async aboutList(req, res) {
        const abouts = await AboutModel.find();
        res.render("client/About_list", {
            title: "All About",
            abouts,
            user: req.user
        });
    }
    async addAboutForm(req, res) {
        res.render("client/About_add", {
            title: "Add About",
            user: req.user
        });
    }
    async createAbout(req, res) {
        const data = req.body;
        if (req.file) data.image = "/uploads/" + req.file.filename;
        await AboutModel.create(data);
        res.redirect("/client/about");
    }
    async editAboutForm(req, res) {
        const about = await AboutModel.findById(req.params.id);
        res.render("client/About_edit", {
            title: "Edit About",
            about,
            user: req.user
        });
    }
    async updateAbout(req, res) {
        try {
            const about = await AboutModel.findById(req.params.id);
            if (!about) {
                req.flash("error", "About not found");
                return res.redirect("/client/about");
            }

            // Handle new file upload
            if (req.file) {
                // Delete old image if exists
                if (about.image) {
                    const oldPath = path.join(__dirname, "../../uploads", path.basename(about.image));
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                // Save new image path
                req.body.image = "/uploads/" + req.file.filename;
            }

            await AboutModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            req.flash("success", "About updated successfully!");
            res.redirect("/client/about");
        } catch (err) {
            console.error(err);
            req.flash("error", "Something went wrong while updating!");
            res.redirect("/client/about");
        }
    }

    async deleteAbout(req, res) {
        try {
            const about = await AboutModel.findById(req.params.id);
            if (!about) {
                req.flash("error", "About not found");
                return res.redirect("/client/about");
            }

            // Delete image if exists
            if (about.image) {
                const oldPath = path.join(__dirname, "../../uploads", path.basename(about.image));
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            await AboutModel.findByIdAndDelete(req.params.id);
            req.flash("success", "About deleted successfully!");
            res.redirect("/client/about");
        } catch (err) {
            console.error(err);
            req.flash("error", "Something went wrong while deleting!");
            res.redirect("/client/about");
        }
    }


    //feature section\\
    // List all features
    async listFeatures(req, res) {
        try {
            const features = await Feature.find().sort({ createdAt: -1 });
            res.render('client/Features_list', { 
                title: "All About",
                features,
                user: req.user
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }

    // Show create form
    async addFeature(req, res) {
        res.render('client/Features_add',{
            title: "All About",
            user: req.user
        });
    }

    // Create a new feature
    async createFeature(req, res) {
        try {
            const { title, content } = req.body;
            await Feature.create({ title, content });
            res.redirect('/client/features');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }

    // Show edit form
    async editFeature(req, res) {
        try {
            const feature = await Feature.findById(req.params.id);
            if (!feature) return res.status(404).send('Feature not found');
            res.render('client/Features_edit', { 
                title: "All About",
                feature,
                user: req.user 
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }

    // Update a feature
    async updateFeature(req, res) {
        try {
            const { title, content } = req.body;
            await Feature.findByIdAndUpdate(req.params.id, { title, content });
            res.redirect('/client/features');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }

    // Delete a feature
    async deleteFeature(req, res) {
        try {
            await Feature.findByIdAndDelete(req.params.id);
            res.redirect('/client/features');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }


    //Contact us
    async contactList(req, res) {
        const allContacts = await ContactUsModel.find()
        res.render('client/ContactUs_List', {
            title: 'Contact Us List',
            message: req.flash('message'),
            contacts: allContacts,
            user: req.user
        })
    }
    async deleteContact(req, res) {
        try {
            await ContactUsModel.findByIdAndDelete(req.params.id);
            req.flash("success", "Message deleted successfully!");
            res.redirect("/client/all_contact");
        } catch (err) {
            console.error(err);
            req.flash("error", "Failed to delete message.");
            res.redirect("/client/all_contact");
        }
    }

}

module.exports = new ClientController()