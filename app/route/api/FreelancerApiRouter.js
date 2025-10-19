const express = require("express");
const FreelancerApiController = require("../../controller/api/FreelancerApiController");
const freelancerAuthApi = require("../../middleware/freelancerAuthApi");
const Image = require("../../helper/Image");
const MessageApiController = require("../../controller/api/MessageApiController");
const router = express.Router();

// Auth
/**
 * @swagger
 * /api/freelancer/register:
 *   post:
 *     summary: Register a new freelancer
 *     tags: [Freelancer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *               phone:
 *                 type: string
 *                 example: "9876543212"
 *     responses:
 *       201:
 *         description: Freelancer registered successfully (OTP sent)
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/register", FreelancerApiController.register);

/**
 * @swagger
 * /api/freelancer/verify-otp:
 *   post:
 *     summary: Verify OTP for freelancer registration
 *     tags: [Freelancer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post("/verify-otp", FreelancerApiController.verifyOtp);

/**
 * @swagger
 * /api/freelancer/login:
 *   post:
 *     summary: Freelancer login
 *     tags: [Freelancer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", FreelancerApiController.login);

/**
 * @swagger
 * /api/freelancer/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Freelancer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset link sent to email
 *       400:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", FreelancerApiController.forgotPassword);

/**
 * @swagger
 * /api/freelancer/reset-password/{id}/{token}:
 *   post:
 *     summary: Reset freelancer password using token
 *     tags: [Freelancer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Freelancer ID
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         description: Reset token sent to freelancer email
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirm_password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *               confirm_password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post("/reset-password/:id/:token", FreelancerApiController.resetPassword);


/**
 * @swagger
 * /api/freelancer/profile/{id}:
 *   put:
 *     summary: Update freelancer profile
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []     # 🔐 Uses Freelancer JWT
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Freelancer ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Node.js", "MongoDB", "Express"]
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Profile
router.put("/profile/:id", freelancerAuthApi, Image.single("avatar"), FreelancerApiController.updateProfile);

/**
 * @swagger
 * /api/freelancer/dashboard:
 *   get:
 *     summary: Get freelancer dashboard data
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []     # 🔐 Uses Freelancer JWT
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Dashboard
router.get("/dashboard", freelancerAuthApi, FreelancerApiController.dashboard);

/**
 * @swagger
 * /api/freelancer/logout:
 *   post:
 *     summary: Logout freelancer and clear session
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []     # 🔐 Uses Freelancer JWT
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Logout
router.post("/logout", freelancerAuthApi, FreelancerApiController.logout);


//message

/**
 * @swagger
 * /api/freelancer/chats:
 *   get:
 *     summary: Get all chat lists for logged-in freelancer
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []
 *     responses:
 *       200:
 *         description: Chat list fetched successfully
 *       401:
 *         description: Unauthorized
 */
// List all chats for Freelancer
router.get("/chats", freelancerAuthApi, MessageApiController.getChatList);


/**
 * @swagger
 * /api/freelancer/chats/{userId}/{jobId}:
 *   get:
 *     summary: Get conversation between Freelancer and Client for a specific job
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client user ID
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID for which the conversation occurred
 *     responses:
 *       200:
 *         description: Chat conversation fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conversation fetched successfully"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       senderId:
 *                         type: string
 *                         example: "67110f0c9b47b2001f83e8a9"
 *                       receiverId:
 *                         type: string
 *                         example: "67110f0c9b47b2001f83e8f1"
 *                       message:
 *                         type: string
 *                         example: "Please share your portfolio."
 *                       timestamp:
 *                         type: string
 *                         example: "2025-10-16T17:24:45.450Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */
// Get conversation with a freelancer for a job
router.get("/chats/:userId/:jobId", freelancerAuthApi, MessageApiController.getConversation);


/**
 * @swagger
 * /api/freelancer/chat/history:
 *   get:
 *     summary: Get chat history between two users for a specific job
 *     tags: [Freelancer]
 *     security:
 *       - freelancerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID for which to fetch chat history
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The logged-in user's ID
 *       - in: query
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Chat history retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       senderId:
 *                         type: string
 *                         example: 67110f0c9b47b2001f83e8a9
 *                       receiverId:
 *                         type: string
 *                         example: 67110f0c9b47b2001f83e8a1
 *                       message:
 *                         type: string
 *                         example: Hello, I’m interested in your project
 *                       createdAt:
 *                         type: string
 *                         example: 2025-10-17T10:20:21.230Z
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get chat history (optional for frontend refresh)
router.get("/chat/history", freelancerAuthApi, MessageApiController.getChatHistory);

module.exports = router;
