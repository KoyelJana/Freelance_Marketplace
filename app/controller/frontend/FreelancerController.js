const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../../model/User');
const { Validator } = require('node-input-validator');
const sendEmailVerificationOTP = require('../../helper/SendMail');
const EmailVerificationModel = require('../../model/otpModel');
const transporter = require('../../config/emailConfig');
const BidModel = require('../../model/Bid');
const { default: mongoose } = require('mongoose');

class FreelancerController {
    /** Register Form */
    async FreelancerRegister(req, res) {
        res.render("frontend/Freelancer_register", {
            title: "Freelancer Register Page",
            message: req.flash("message"),
            activePage: "Freelancer_register",
        });
    }
 
    /** Create Freelancer Register */
    async FreelancerRegisterCreate(req, res) {
        try {
            const v = new Validator(req.body, {
                name: "required|string",
                email: "required|email",
                phone: "required|string|minLength:10|maxLength:10",
                password: "required|string|minLength:6",
            });

            const matched = await v.check();
            if (!matched) {
                const errors = v.errors;
                const firstError = Object.keys(errors)[0];
                req.flash("message", errors[firstError].message);
                return res.redirect("/register");
            }

            const { name, email, phone, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            const freelancer = await UserModel.create({
                name,
                email,
                phone,
                password: hashPassword,
            });

            if (freelancer) {
                sendEmailVerificationOTP(req, freelancer);
                req.flash("message", "Account created successfully. Verify your email.");
                return res.redirect("/verify_otp");
            } else {
                req.flash("message", "Failed to register");
                return res.redirect("/register");
            }
        } catch (error) {
            console.error("Register Error:", error);
            req.flash("message", "Something went wrong.");
            return res.redirect("/register");
        }
    }


    //verify otp form
    async verifiotpForm(req, res) {
        try {
            res.render('frontend/Freelancer_verify_Otp', {
                title: 'Freelancer verify otp page',
                message: req.flash('message'),
                activePage: "Freelancer_verify_Otp"
            });
        } catch (error) {
            console.error(error);
        }
    }

    //email verified
    async verifiotp(req, res) {
        try {
            const { email, otp } = req.body;
            // Check if all required fields are provided
            if (!email || !otp) {
                req.flash('message', "All field are required")
                return res.redirect('/verify_otp')
            }
            const existingUser = await UserModel.findOne({ email });

            // Check if email doesn't exists
            if (!existingUser) {
                req.flash('message', "Email does't exists")
                return res.redirect('/verify_otp')
            }

            // Check if email is already verified
            if (existingUser.is_verified) {
                req.flash('message', "Email is already verified")
                return res.redirect('/verify_otp')
            }
            // Check if there is a matching email verification OTP
            const emailVerification = await EmailVerificationModel.findOne({ userId: existingUser._id, otp });
            if (!emailVerification) {
                if (!existingUser.is_verified) {
                    // console.log(existingUser);
                    await sendEmailVerificationOTP(req, existingUser);
                    req.flash('message', "Invalid OTP, new OTP sent to your email")
                    return res.redirect('/verify_otp')
                }
                req.flash('message', "Invalid OTP")
                return res.redirect('/verify_otp')
            }
            // Check if OTP is expired
            const currentTime = new Date();
            // 15 * 60 * 1000 calculates the expiration period in milliseconds(15 minutes).
            const expirationTime = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
            if (currentTime > expirationTime) {
                // OTP expired, send new OTP
                await sendEmailVerificationOTP(req, existingUser);
                req.flash('message', "OTP expired, new OTP sent to your email")
                return res.redirect('/verify_otp')
            }
            // OTP is valid and not expired, mark email as verified
            existingUser.is_verified = true;
            await existingUser.save();

            // Delete email verification document
            await EmailVerificationModel.deleteMany({ userId: existingUser._id });
            req.flash('message', "Email verified successfully")
            return res.redirect('/login')


        } catch (error) {
            console.error(error);
        }

    }


    //Freelancer login form
    async FreelancerLogin(req, res) {
        try {
            res.render('frontend/Freelancer_login', {
                title: 'Freelancer login Page',
                message: req.flash('message'),
                activePage: "Freelancer_login"
            });
        } catch (error) {
            console.error(error);
        }
    }


    //create Freelancer login
    async FreelancerLoginCreate(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                req.flash('message', 'All input fields is required')
                return res.redirect('/login')
            }

            const freelancer = await UserModel.findOne({ email });

            if (!freelancer) {
                req.flash('message', 'Freelancer not found')
                return res.redirect('/login')
            }
 

            const isMatchPassword = await bcrypt.compare(password, freelancer.password)
            if (!isMatchPassword) {
                req.flash('message', 'Invalid password');
                return res.redirect('/login')

            }

            if (!freelancer.is_verified) {
                req.flash('message', 'Email is not verified');
                return res.redirect('/login')

            }



            const token = jwt.sign({
                _id: freelancer._id,
                name: freelancer.name,
                email: freelancer.email,
                phone: freelancer.phone,
                role: freelancer.role,
                avatar: freelancer.avatar,
                skills: freelancer.skills
            }, process.env.JWT_TOKEN_SECRET_KEY, { expiresIn: "3h" })

            if (token) {
                res.cookie('FreelancerToken', token)
                req.session.freelancer = {
                    _id: freelancer._id,
                    name: freelancer.name,
                    email: freelancer.email,
                    phone: freelancer.phone,
                    role: freelancer.role,
                    avatar: freelancer.avatar,
                    skills: freelancer.skills
                };

                req.session.save(err => {
                    if (err) {
                        console.error('Session save error:', err);
                        req.flash('message', 'Login failed, please try again.');
                        return res.redirect('/login');
                    }
                    res.redirect('/');
                });
            }


        } catch (err) {
            console.log(err);

        }
    }

    //forgot password link form
    async forgotPasswordLinkForm(req, res) {
        try {
            res.render('frontend/Freelancer_ForgotPassword_link', {
                title: 'Freelancer Forgot Password link',
                message: req.flash('message'),
                activePage: "Freelancer_ForgotPassword_link"
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
                return res.redirect('/forgot_password_link')
            }
            const user = await UserModel.findOne({ email });
            if (!user) {
                req.flash('message', "Email doesn't exist")
                return res.redirect('/forgot_password_link')
            }
            // Generate token for password reset
            const secret = user._id + process.env.JWT_SECRET_KEY;
            const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '20m' });
            // Reset Link and this link generate by frontend developer
            // const resetLink = `${process.env.FRONTEND_HOST}/account/reset-password-confirm/${user._id}/${token}`;
            const resetLink = `http://${req.headers.host}/reset_password/${user.id}/${token}`;
            //console.log(resetLink);
            // Send password reset email  
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password.</p>`
            });
            // Send success response
            req.flash('message', "Password reset link send your email. Please check your email.")
            return res.redirect('/login')

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

                res.render('frontend/Freelancer_reset_password', {
                    userId: id,
                    token: token,
                    message: null,
                    title: 'Freelancer Reset Password',
                    activePage: "Freelancer_reset_password"
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
                return res.render('frontend/Freelancer_reset_password', {
                    title: 'Freelancer Reset Password',
                    userId: id,
                    token: token,
                    message: "Invalid password reset link.",
                    activePage: "Freelancer_reset_password"
                });
            }

            const new_secret = user._id + process.env.JWT_SECRET_KEY;
            try {
                jwt.verify(token, new_secret);
            } catch (jwtError) {
                console.error('JWT Verification Error:', jwtError.message);
                // Render the EJS page with an error message
                return res.render('frontend/Freelancer_reset_password', {
                    title: 'Freelancer Reset Password',
                    userId: id,
                    token: token,
                    message: "Password reset link is invalid or has expired.",
                    activePage: "User_reset_password"
                });
            }

            if (!password || !confirm_password) {
                return res.render('frontend/User_reset_password', {
                    title: 'User Reset Password',
                    userId: id,
                    token: token,
                    message: "New Password and Confirm New Password are required.",
                    activePage: "User_reset_password"
                });
            }
            if (password !== confirm_password) {
                return res.render('frontend/User_reset_password', {
                    title: 'User Reset Password',
                    userId: id,
                    token: token,
                    message: "Passwords do not match.",
                    activePage: "Freelancer_reset_password"
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            //Update Freelancer's password and save
            await user.save();

            req.flash('message', "Your password reset successfully")
            return res.redirect('/login');

        } catch (error) {
            console.error('An unexpected error occurred:', error);
            return res.render('frontend/Freelancer_reset_password', {
                title: 'Freelancer Reset Password',
                FreelancerId: req.params.id,
                token: req.params.token,
                message: "Unable to reset password. Please try again later.",
                activePage: "Freelancer_reset_password"
            });
        }
    }


    /** Edit Profile */
    async editFreelancer(req, res) {
        try {
            const freelancer = await UserModel.findById(req.params.id);
            if (freelancer) {
                return res.render("frontend/Edit_Freelancer", {
                    title: "Edit Freelancer Profile",
                    activePage:"Edit_Freelancer",
                    message: req.flash("message"),
                    freelancer,
                });
            }
            req.flash("message", "Freelancer not found.");
            return res.redirect("/");
        } catch (error) {
            console.error("Edit Freelancer Error:", error);
            req.flash("message", "Something went wrong.");
            return res.redirect("/");
        }
    }

    /** Update Profile with Avatar Upload */
    async updateFreelancer(req, res) {
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

            const updatedFreelancer = await UserModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedFreelancer) {
                req.flash("message", "Profile updated successfully.");
                return res.redirect("/");
            }

            req.flash("message", "Freelancer not found.");
            return res.redirect("/edit/" + id);
        } catch (error) {
            console.error("Update Freelancer Error:", error);
            req.flash("message", "Something went wrong.");
            return res.redirect("/");
        }
    }

    // Freelancer Dashboard
    async FreelancerDashboard(req, res) {
        try {
            const freelancerId = new mongoose.Types.ObjectId(req.session.freelancer._id);

            // Aggregate bids with job info
            const bids = await BidModel.aggregate([
                { $match: { freelancerId } },
                {
                    $lookup: {
                        from: "jobs",              // collection name in MongoDB
                        localField: "jobId",
                        foreignField: "_id",
                        as: "job"
                    }
                },
                { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } }, // attach job details
                {
                    $project: {
                        proposal: 1,
                        amount: 1,
                        deliveryDays: 1,
                        status: 1,
                        "job.title": 1,
                        "job.status": 1,
                        "job.budget": 1,
                        "job.deadline": 1
                    }
                }
            ]); 

            // Split jobs by status
            const activeJobs = bids.filter(b => b.job?.status === "in_progress" || b.job?.status === "open");
            const completedJobs = bids.filter(b => b.job?.status === "completed");

            res.render("frontend/Freelancer_dashboard", {
                title: "Freelancer Dashboard",
                activePage: "freelancer_dashboard",
                message: req.flash("message"),
                freelancer: req.session.freelancer,
                bids,
                activeJobs,
                completedJobs,
            });
        } catch (error) {
            console.error(error);
            req.flash("message", "Unable to load dashboard");
            res.redirect("/");
        }
    }



    //logout
    async FreelancerLogout(req, res) {
        req.session.destroy(err => {
            if (err) {
                console.error(err);
                return res.redirect('/');
            }
            res.clearCookie('FreelancerToken');
            res.redirect('/login');
        });
    }

}


module.exports = new FreelancerController()