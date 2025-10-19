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
const Feature = require('../../model/Feature');
const FeatureModel = require('../../model/Feature');



class ClientApiController {

    /** Register Client */
    async ClientRegisterCreate(req, res) {
        try {
            const v = new Validator(req.body, {
                name: "required|string",
                email: "required|email",
                phone: "required|string|minLength:10|maxLength:10",
                password: "required|string|minLength:6"
            });

            const matched = await v.check();
            if (!matched)
                return res.status(400).json({ success: false, errors: v.errors });

            const { name, email, phone, password } = req.body;

            const existing = await UserModel.findOne({ email });
            if (existing)
                return res.status(400).json({ success: false, message: "Email already registered" });

            const hashPassword = await bcrypt.hash(password, 10);

            const user = await UserModel.create({ name, email, phone, password: hashPassword, role: "client" });
            await sendEmailVerificationOTP(req, user);

            return res.status(200).json({
                success: true,
                message: "Client registered successfully, please verify your email",
                redirectUrl: "/client/verify_otp"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Verify OTP */
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp)
                return res.status(400).json({ success: false, message: "Email and OTP required" });

            const existingUser = await UserModel.findOne({ email });
            if (!existingUser)
                return res.status(404).json({ success: false, message: "User not found" });

            const emailVerification = await EmailVerificationModel.findOne({ userId: existingUser._id, otp });
            if (!emailVerification)
                return res.status(400).json({ success: false, message: "Invalid OTP" });

            const expired = new Date() > new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
            if (expired)
                return res.status(400).json({ success: false, message: "OTP expired" });

            existingUser.is_verified = true;
            await existingUser.save();
            await EmailVerificationModel.deleteMany({ userId: existingUser._id });

            return res.status(200).json({ success: true, message: "Email verified successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Login */
    async ClientLoginCreate(req, res) {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "All fields required" });
            }

            const user = await UserModel.findOne({ email });
            if (!user)
                return res.status(404).json({ success: false, message: "User not found" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(401).json({ success: false, message: "Invalid password" });

            if (!user.is_verified)
                return res.status(403).json({ success: false, message: "Email not verified" });
            if (user.role !== "client")
                return res.status(403).json({ success: false, message: "Unauthorized role" });

            const token = jwt.sign(
                { _id: user._id, name: user.name, email: user.email, role: user.role },
                process.env.JWT_TOKEN_SECRET_KEY || "secret",
                { expiresIn: "1d" }
            );

            res.cookie("clientToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // only send over HTTPS in prod
                sameSite: "lax",               // prevents CSRF in most cases; change to 'strict' if safe
                maxAge: 1 * 24 * 60 * 60 * 1000 // ms (1 days) or use expires
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }


    // Forgot Password (Send Email)
    // ============================
    async forgotPasswordLink(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }

            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: "Email not found" });
            }

            const secret = user._id + process.env.JWT_SECRET_KEY;
            const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "20m" });
            const resetLink = `http://${req.headers.host}/api/client/reset-password/${user.id}/${token}`;

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Hello ${user.name || "User"},</p>
               <p>Click below to reset your password:</p>
               <a href="${resetLink}">${resetLink}</a>
               <p>This link will expire in 20 minutes.</p>`,
            });

            return res.status(200).json({
                success: true,
                message: "Password reset link sent successfully. Check your email.",
                resetLink, // optional: useful for testing in Postman
            });
        } catch (error) {
            console.error("Forgot Password Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to send password reset link. Try again later.",
            });
        }
    }

    // ============================
    // Reset Password (Verify Token & Save)
    // ============================
    async resetPassword(req, res) {
        try {
            const { id, token } = req.params;
            const { password, confirm_password } = req.body;

            if (!password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    message: "Password and Confirm Password are required.",
                });
            }

            if (password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    message: "Passwords do not match.",
                });
            }

            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Invalid or expired password reset link.",
                });
            }

            const secret = user._id + process.env.JWT_SECRET_KEY;
            try {
                jwt.verify(token, secret);
            } catch (jwtError) {
                console.error("JWT Verification Error:", jwtError.message);
                return res.status(401).json({
                    success: false,
                    message: "Password reset link is invalid or expired.",
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password reset successfully. You can now log in.",
            });
        } catch (error) {
            console.error("Reset Password Error:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred while resetting your password. Try again later.",
            });
        }
    }

    /** Dashboard Stats */
    async ClientDashboard(req, res) {
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

            res.status(200).json({ success: true, jobCounts, bidCounts });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Get Profile */
    async getProfile(req, res) {
        try {
            const client = await UserModel.findById(req.user._id);
            if (!client)
                return res.status(404).json({ success: false, message: "Client not found" });

            res.status(200).json({ success: true, client });
        } catch (error) {
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Update Profile */
    async updateClient(req, res) {
        try {
            const id = req.params.id;
            const { name, phone, bio, skills } = req.body;
            const updateData = { name, phone, bio, skills: skills?.split(',') || [] };

            if (req.file) updateData.avatar = "/uploads/" + req.file.filename;

            const updatedClient = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedClient)
                return res.status(404).json({ success: false, message: "Client not found" });

            res.status(200).json({ success: true, message: "Profile updated successfully", updatedClient });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Logout */
    async ClientLogout(req, res) {
        res.status(200).json({ success: true, message: "Logout successful" });
    }

    // ---------------------- BID MANAGEMENT ----------------------

    // View all bids for a specific job
    async getJobBids(req, res) {
        try {
            const { jobId } = req.params;
            const job = await JobModel.findById(jobId);
            if (!job) return res.status(404).json({ success: false, message: "Job not found" });

            const bids = await BidModel.find({ jobId }).populate("freelancerId", "name email");
            res.json({ success: true, job, bids });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    // Get all bids grouped by status
    async getAllBids(req, res) {
        try {
            const pending = await BidModel.find({ status: "pending" });
            const accepted = await BidModel.find({ status: "accepted" });
            const rejected = await BidModel.find({ status: "rejected" });

            res.json({ success: true, pending, accepted, rejected });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Failed to fetch bids" });
        }
    }

    // Accept a bid
    async acceptBid(req, res) {
        try {
            const bidId = req.params.id;

            // Find the bid
            const bid = await BidModel.findById(bidId);
            if (!bid) {
                return res.status(404).json({
                    success: false,
                    message: "Bid not found"
                });
            }

            // Update this bid to accepted
            bid.status = "accepted";
            await bid.save();

            // Update related job to in_progress
            const job = await JobModel.findByIdAndUpdate(
                bid.jobId,
                { status: "in_progress" },
                { new: true }
            );

            // Reject all other pending bids for the same job
            await BidModel.updateMany(
                { jobId: bid.jobId, _id: { $ne: bid._id }, status: "pending" },
                { $set: { status: "rejected" } }
            );

            // Create an automatic message to freelancer
            const messageContent = `Your bid for "${job.title}" has been accepted by the client!`;

            const message = await Message.create({
                jobId: job._id,
                senderId: req.user._id,        // Assuming API client user stored in req.user
                receiverId: bid.freelancerId,
                message: messageContent,
                status: "sent"
            });

            // Emit live message to freelancer via Socket.io
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

            return res.status(200).json({
                success: true,
                message: "Bid accepted successfully, job moved to in_progress, other bids rejected",
                bid,
                job
            });

        } catch (error) {
            console.error("Error accepting bid:", error);
            return res.status(500).json({
                success: false,
                message: "Error accepting bid",
                error: error.message
            });
        }
    }

    // Reject a bid
    async rejectBid(req, res) {
        try {
            const { id } = req.params;
            await BidModel.findByIdAndUpdate(id, { status: "rejected" });
            res.json({ success: true, message: "Bid rejected successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Error rejecting bid" });
        }
    }

    // ---------------------- BANNER ----------------------

    async getAllBanners(req, res) {
        const banners = await BannerModel.find();
        res.json({ success: true, banners });
    }

    async createBanner(req, res) {
        try {
            const data = req.body;
            if (req.file) data.image = "/uploads/" + req.file.filename;
            const banner = await BannerModel.create(data);
            res.json({ success: true, banner });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateBanner(req, res) {
        try {
            const banner = await BannerModel.findById(req.params.id);
            if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

            if (req.file) {
                if (banner.image) {
                    const oldPath = path.join(__dirname, "../../uploads", path.basename(banner.image));
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                req.body.image = "/uploads/" + req.file.filename;
            }

            const updated = await BannerModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ success: true, message: "Banner updated", banner: updated });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteBanner(req, res) {
        try {
            const banner = await BannerModel.findById(req.params.id);
            if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

            if (banner.image) {
                const oldPath = path.join(__dirname, "../../uploads", path.basename(banner.image));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            await banner.deleteOne();
            res.json({ success: true, message: "Banner deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ---------------------- ABOUT ----------------------

    async getAllAbouts(req, res) {
        const abouts = await AboutModel.find();
        res.json({ success: true, abouts });
    }

    async createAbout(req, res) {
        try {
            const data = req.body;
            if (req.file) data.image = "/uploads/" + req.file.filename;
            const about = await AboutModel.create(data);
            res.json({ success: true, about });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateAbout(req, res) {
        try {
            const about = await AboutModel.findById(req.params.id);
            if (!about) return res.status(404).json({ success: false, message: "About not found" });

            if (req.file) {
                if (about.image) {
                    const oldPath = path.join(__dirname, "../../uploads", path.basename(about.image));
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                req.body.image = "/uploads/" + req.file.filename;
            }

            const updated = await AboutModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ success: true, message: "About updated", about: updated });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteAbout(req, res) {
        try {
            const about = await AboutModel.findById(req.params.id);
            if (!about) return res.status(404).json({ success: false, message: "About not found" });

            if (about.image) {
                const oldPath = path.join(__dirname, "../../uploads", path.basename(about.image));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            await about.deleteOne();
            res.json({ success: true, message: "About deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ---------------------- FEATURES ----------------------

    async getAllFeatures(req, res) {
        try {
            const features = await FeatureModel.find().sort({ createdAt: -1 });
            res.json({ success: true, features });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createFeature(req, res) {
        try {
            const feature = await FeatureModel.create(req.body);
            res.json({ success: true, feature });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateFeature(req, res) {
        try {
            const feature = await FeatureModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ success: true, message: "Feature updated", feature });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteFeature(req, res) {
        try {
            await FeatureModel.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Feature deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ---------------------- CONTACT US ----------------------

    async getAllContacts(req, res) {
        try {
            const contacts = await ContactUsModel.find().sort({ createdAt: -1 });
            res.json({ success: true, contacts });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async deleteContact(req, res) {
        try {
            await ContactUsModel.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Contact deleted successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

}

module.exports = new ClientApiController();
