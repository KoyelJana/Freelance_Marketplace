const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../../model/User");
const { Validator } = require("node-input-validator");
const sendEmailVerificationOTP = require("../../helper/SendMail");
const EmailVerificationModel = require("../../model/otpModel");
const transporter = require("../../config/emailConfig");
const BidModel = require("../../model/Bid");
const mongoose = require("mongoose");

class FreelancerApiController {
  /** =========================
   *  REGISTER FREELANCER
   * ========================= */
  async register(req, res) {
    try {
      const v = new Validator(req.body, {
        name: "required|string",
        email: "required|email",
        phone: "required|string|minLength:10|maxLength:10",
        password: "required|string|minLength:6",
      });

      const matched = await v.check();
      if (!matched) {
        return res.status(400).json({
          success: false,
          message: Object.values(v.errors)[0].message,
        });
      }

      const { name, email, phone, password } = req.body;
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const freelancer = await UserModel.create({
        name,
        email,
        phone,
        password: hashPassword
      });

      if (freelancer) {
        await sendEmailVerificationOTP(req, freelancer);
        return res.status(201).json({
          success: true,
          message: "Account created. Please verify your email.",
          data:freelancer
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to register freelancer"
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** =========================
   *  VERIFY EMAIL OTP
   * ========================= */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res
          .status(400)
          .json({ success: false, message: "Email and OTP are required" });

      const user = await UserModel.findOne({ email });
      if (!user)
        return res.status(404).json({ success: false, message: "Email not found" });

      if (user.is_verified)
        return res.status(400).json({
          success: false,
          message: "Email already verified",
        });

      const otpRecord = await EmailVerificationModel.findOne({ userId: user._id, otp });
      if (!otpRecord) {
        await sendEmailVerificationOTP(req, user);
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. New OTP sent to email.",
        });
      }

      const expirationTime = new Date(otpRecord.createdAt.getTime() + 15 * 60 * 1000);
      if (new Date() > expirationTime) {
        await sendEmailVerificationOTP(req, user);
        return res.status(400).json({
          success: false,
          message: "OTP expired. New OTP sent to email.",
        });
      }

      user.is_verified = true;
      await user.save();
      await EmailVerificationModel.deleteMany({ userId: user._id });

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** =========================
   *  LOGIN FREELANCER
   * ========================= */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });

      const user = await UserModel.findOne({ email });
      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(400).json({ success: false, message: "Invalid password" });

      if (!user.is_verified)
        return res
          .status(400)
          .json({ success: false, message: "Please verify your email first" });

      const token = jwt.sign(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          skills: user.skills,
        },
        process.env.JWT_TOKEN_SECRET_KEY,
        { expiresIn: "3h" }
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** =========================
   *  FORGOT PASSWORD (Send link)
   * ========================= */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email)
        return res.status(400).json({ success: false, message: "Email is required" });

      const user = await UserModel.findOne({ email });
      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      const secret = user._id + process.env.JWT_SECRET_KEY;
      const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "20m" });

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password Reset Link",
        html: `<p>Hello ${user.name}, click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });

      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** =========================
   *  RESET PASSWORD
   * ========================= */
  async resetPassword(req, res) {
    try {
      const { id, token } = req.params;
      const { password, confirm_password } = req.body;

      const user = await UserModel.findById(id);
      if (!user)
        return res.status(404).json({ success: false, message: "Invalid user ID" });

      const secret = user._id + process.env.JWT_SECRET_KEY;
      jwt.verify(token, secret);

      if (!password || !confirm_password)
        return res.status(400).json({
          success: false,
          message: "Both password fields are required",
        });

      if (password !== confirm_password)
        return res.status(400).json({ success: false, message: "Passwords do not match" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset Password Error:", error);
      res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  }

  /** =========================
   *  UPDATE PROFILE
   * ========================= */
  async updateProfile(req, res) {
    try {
      const id = req.params.id;
      const { name, phone, bio, skills } = req.body;

      const updateData = {
        name,
        phone,
        bio,
        skills: skills ? skills.split(",").map((s) => s.trim()) : [],
      };

      if (req.file) updateData.avatar = "/uploads/" + req.file.filename;

      const updated = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated)
        return res.status(404).json({ success: false, message: "Freelancer not found" });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  /** =========================
   *  FREELANCER DASHBOARD
   * ========================= */
  async dashboard(req, res) {
    try {
      const freelancerId = new mongoose.Types.ObjectId(req.freelancer._id);

      const bids = await BidModel.aggregate([
        { $match: { freelancerId } },
        {
          $lookup: {
            from: "jobs",
            localField: "jobId",
            foreignField: "_id",
            as: "job",
          },
        },
        { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            proposal: 1,
            amount: 1,
            deliveryDays: 1,
            status: 1,
            "job.title": 1,
            "job.status": 1,
            "job.budget": 1,
            "job.deadline": 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Freelancer dashboard data",
        bids,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Unable to load dashboard" });
    }
  }

  /** =========================
   *  LOGOUT
   * ========================= */
  async logout(req, res) {
    try {
      res.clearCookie("FreelancerToken");
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Logout failed" });
    }
  }
}

module.exports = new FreelancerApiController();
