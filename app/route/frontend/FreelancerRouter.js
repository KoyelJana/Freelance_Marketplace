const express=require('express');
const FreelancerController = require('../../controller/frontend/FreelancerController');
const freelancerAuth = require('../../middleware/freelancerAuth');
const Image = require('../../helper/Image');
const MessageController = require('../../controller/MessageController');
const router=express.Router();

router.get('/register',FreelancerController.FreelancerRegister);
router.post('/register/create',FreelancerController.FreelancerRegisterCreate)

router.get('/verify_otp',FreelancerController.verifiotpForm)
router.post('/verify_otp/create',FreelancerController.verifiotp)

router.get('/login',FreelancerController.FreelancerLogin)
router.post('/login/create',FreelancerController.FreelancerLoginCreate)

router.get('/forgot_password_link',FreelancerController.forgotPasswordLinkForm);
router.post('/forgot_password_link/create',FreelancerController.forgotPasswordLink);

router.get('/reset_password/:id/:token',FreelancerController.resetPasswordForm);
router.post('/reset_password/:id/:token',FreelancerController.resetPassword);

// Profile edit + update with avatar upload
router.get("/edit/:id", freelancerAuth, FreelancerController.editFreelancer);
router.post("/update/:id", freelancerAuth, Image.single("avatar"), FreelancerController.updateFreelancer);

//message
// Show all chats for freelancer
router.get("/chats", freelancerAuth, MessageController.getChatList);
// Open conversation with a client for a job
router.get("/chat/:userId/:jobId", freelancerAuth, MessageController.getConversation);
// API to fetch chat history (optional for AJAX)
router.get("/chat/history", freelancerAuth, MessageController.getChatHistory);


router.get('/dashboard',freelancerAuth,FreelancerController.FreelancerDashboard)

router.get('/logout',freelancerAuth,FreelancerController.FreelancerLogout)

module.exports=router