const express = require("express");
const ClientApiController = require("../../controller/api/ClientApiController");
const clientAuthApi = require("../../middleware/clientAuthApi");
const Image = require("../../helper/Image");
const MessageApiController = require("../../controller/api/MessageApiController");
const router = express.Router();

/* ===========================
   AUTHENTICATION ROUTES
=========================== */

// /**
//  * @swagger
//  * /api/client/register:
//  *   post:
//  *     summary: Register a new client
//  *     tags:
//  *       - Auth
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - in: body
//  *         name: Client
//  *         description: Register a new client
//  *         schema:
//  *           type: object
//  *           required:
//  *             - name
//  *             - email
//  *             - phone
//  *             - password
//  *           properties:
//  *             name:
//  *               type: string
//  *               example: "Koyel Jana"
//  *             email:
//  *               type: string
//  *               example: "koyel@example.com"
//  *             phone:
//  *               type: string
//  *               example: "8478804950"
//  *             password:
//  *               type: string
//  *               example: "password123"
//  *     responses:
//  *       201:
//  *         description: Client registered successfully
//  *       400:
//  *         description: Invalid input or user already exists
//  *       500:
//  *         description: Server error
//  */
// Register
router.post("/register", ClientApiController.ClientRegisterCreate);


// /**
//  * @swagger
//  * /api/client/verify-otp:
//  *   post:
//  *     summary: Verify OTP for client email verification
//  *     tags:
//  *       - Client
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - in: body
//  *         name: Verify OTP
//  *         description: Verify client email using the received OTP.
//  *         schema:
//  *           type: object
//  *           required:
//  *             - email
//  *             - otp
//  *           properties:
//  *             email:
//  *               type: string
//  *               example: "koyel@example.com"
//  *             otp:
//  *               type: string
//  *               example: "123456"
//  *     responses:
//  *       200:
//  *         description: OTP verified successfully
//  *       400:
//  *         description: Invalid or expired OTP
//  *       500:
//  *         description: Server error during OTP verification
//  */
// Verify OTP
router.post("/verify-otp", ClientApiController.verifyOtp);



/**
 * @swagger
 * /api/client/login:
 *   post:
 *     summary: Client login
 *     tags: [Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:               # ✅ Must be JSON, not form-data
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "koyel@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Unauthorized role or unverified email
 *       404:
 *         description: User not found
 */

// Login
router.post("/login", ClientApiController.ClientLoginCreate);



/**
 * @swagger
 * /api/client/forgot-password:
 *   post:
 *     summary: Send password reset link
 *     tags: [Client]
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
 *                 example: "koyel@example.com"
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       400:
 *         description: Email not found
 *       500:
 *         description: Server error
 */

// Forgot password (send reset link)
router.post("/forgot-password", ClientApiController.forgotPasswordLink);


/**
 * @swagger
 * /api/client/reset-password/{id}/{token}:
 *   post:
 *     summary: Reset client password using token
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token
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
 *         description: Invalid token or mismatch
 *       500:
 *         description: Server error
 */
// Reset password
router.post("/reset-password/:id/:token", ClientApiController.resetPassword);


/**
 * @swagger
 * /api/client/logout:
 *   post:
 *     summary: Logout client (clears authentication cookie)
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
// Logout
router.post("/logout", clientAuthApi, ClientApiController.ClientLogout);

/* ===========================
   CLIENT PROFILE
=========================== */


/**
 * @swagger
 * /api/client/profile:
 *   get:
 *     summary: Get logged-in client profile
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Client profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get client profile
router.get("/profile", clientAuthApi, ClientApiController.getProfile);


/**
 * @swagger
 * /api/client/profile/{id}:
 *   put:
 *     summary: Update client profile (with avatar upload)
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Koyel Jana"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Upload new profile image
 *     responses:
 *       200:
 *         description: Client profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Update client profile (with avatar upload)
router.put("/profile/:id", clientAuthApi, Image.single("avatar"), ClientApiController.updateClient);

/* ===========================
   DASHBOARD & BIDS
=========================== */

/**
 * @swagger
 * /api/client/dashboard:
 *   get:
 *     summary: Get client dashboard summary
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Dashboard summary
router.get("/dashboard", clientAuthApi, ClientApiController.ClientDashboard);


/**
 * @swagger
 * /api/client/bids:
 *   get:
 *     summary: Get all bids for jobs posted by the client
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bids fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Get all bids for all jobs
router.get("/bids", clientAuthApi, ClientApiController.getAllBids);


/**
 * @swagger
 * /api/client/bids/job/{jobId}:
 *   get:
 *     summary: Get bids for a specific job
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID for which to fetch bids
 *     responses:
 *       200:
 *         description: Bids fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

// View bids for a specific job
router.get("/bids/job/:jobId", clientAuthApi, ClientApiController.getJobBids);


/**
 * @swagger
 * /api/client/bids/{id}/accept:
 *   put:
 *     summary: Accept a freelancer bid
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bid ID to accept
 *     responses:
 *       200:
 *         description: Bid accepted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bid not found
 *       500:
 *         description: Server error
 */
// Accept Bid
router.put("/bids/:id/accept", clientAuthApi, ClientApiController.acceptBid);

/**
 * @swagger
 * /api/client/bids/{id}/reject:
 *   put:
 *     summary: Reject a freelancer bid
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bid ID to reject
 *     responses:
 *       200:
 *         description: Bid rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bid not found
 *       500:
 *         description: Server error
 */

// Reject Bid
router.put("/bids/:id/reject", clientAuthApi, ClientApiController.rejectBid);

/* ===========================
   BANNER CRUD
=========================== */

/**
 * @swagger
 * /api/client/banners:
 *   get:
 *     summary: Get all banners created by the client
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all client banners retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/banners", clientAuthApi, ClientApiController.getAllBanners);

/**
 * @swagger
 * /api/client/banners/create:
 *   post:
 *     summary: Create a new banner
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, image]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Adopt a Pet Today"
 *               description:
 *                 type: string
 *                 example: "Join our mission to find loving homes for pets."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload banner image
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/banners/create", clientAuthApi, Image.single("image"), ClientApiController.createBanner);

/**
 * @swagger
 * /api/client/banners/update/{id}:
 *   put:
 *     summary: Update an existing banner
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Pet Adoption Campaign"
 *               description:
 *                 type: string
 *                 example: "Helping animals find homes since 2024."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload new banner image
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       400:
 *         description: Invalid input or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 */
router.put("/banners/update/:id", clientAuthApi, Image.single("image"), ClientApiController.updateBanner);

/**
 * @swagger
 * /api/client/banners/delete/{id}:
 *   delete:
 *     summary: Delete a banner
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID to delete
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 */
router.delete("/banners/delete/:id", clientAuthApi, ClientApiController.deleteBanner);

/* ===========================
   ABOUT CRUD
=========================== */

/**
 * @swagger
 * /api/client/about:
 *   get:
 *     summary: Get all About sections created by the client
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all About sections retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/about", clientAuthApi, ClientApiController.getAllAbouts);

/**
 * @swagger
 * /api/client/about/create:
 *   post:
 *     summary: Create a new About section
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content, image]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "About Our Mission"
 *               content:
 *                 type: string
 *                 example: "We connect freelancers and clients to create opportunities for growth and success."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload an image for the About section
 *     responses:
 *       201:
 *         description: About section created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/about/create", clientAuthApi, Image.single("image"), ClientApiController.createAbout); 

/**
 * @swagger
 * /api/client/about/update/{id}:
 *   put:
 *     summary: Update an existing About section
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: About section ID to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Company Vision"
 *               content:
 *                 type: string
 *                 example: "Empowering businesses through freelance talent."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload new image (optional)
 *     responses:
 *       200:
 *         description: About section updated successfully
 *       400:
 *         description: Invalid input or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: About section not found
 *       500:
 *         description: Server error
 */
router.put("/about/update/:id", clientAuthApi, Image.single("image"), ClientApiController.updateAbout); 

/**
 * @swagger
 * /api/client/about/delete/{id}:
 *   delete:
 *     summary: Delete an About section
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: About section ID to delete
 *     responses:
 *       200:
 *         description: About section deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: About section not found
 *       500:
 *         description: Server error
 */
router.delete("/about/delete/:id", clientAuthApi, ClientApiController.deleteAbout);

/* ===========================
   FEATURES CRUD
=========================== */

/**
 * @swagger
 * /api/client/features:
 *   get:
 *     summary: Get all features created by the client
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all features retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/features", clientAuthApi, ClientApiController.getAllFeatures);

/**
 * @swagger
 * /api/client/features/create:
 *   post:
 *     summary: Create a new feature
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Fast Communication"
 *               content:
 *                 type: string
 *                 example: "Instant messaging between clients and freelancers."
 *     responses:
 *       201:
 *         description: Feature created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/features/create", clientAuthApi, ClientApiController.createFeature);

/**
 * @swagger
 * /api/client/features/update/{id}:
 *   put:
 *     summary: Update an existing feature
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature ID to update
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Secure Payments"
 *               content:
 *                 type: string
 *                 example: "All transactions are encrypted for your safety."
 *     responses:
 *       200:
 *         description: Feature updated successfully
 *       400:
 *         description: Invalid input or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feature not found
 *       500:
 *         description: Server error
 */
router.put("/features/update/:id", clientAuthApi, ClientApiController.updateFeature);

/**
 * @swagger
 * /api/client/features/delete/{id}:
 *   delete:
 *     summary: Delete a feature
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature ID to delete
 *     responses:
 *       200:
 *         description: Feature deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feature not found
 *       500:
 *         description: Server error
 */
router.delete("/features/delete/:id", clientAuthApi, ClientApiController.deleteFeature);

/* ===========================
   CONTACT MANAGEMENT
=========================== */

/**
 * @swagger
 * /api/client/contacts:
 *   get:
 *     summary: Get all contact messages submitted by users
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all contact messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All contact messages fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6710a1b5f7f03a001f94b342"
 *                       name:
 *                         type: string
 *                         example: "Riya Sen"
 *                       email:
 *                         type: string
 *                         example: "riya@example.com"
 *                       message:
 *                         type: string
 *                         example: "I am interested in your freelance services."
 *                       createdAt:
 *                         type: string
 *                         example: "2025-10-16T14:45:23.123Z"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/contacts", clientAuthApi, ClientApiController.getAllContacts);

/**
 * @swagger
 * /api/client/contacts/delete/{id}:
 *   delete:
 *     summary: Delete a contact message by ID
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message ID to delete
 *     responses:
 *       200:
 *         description: Contact message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Contact deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.delete("/contacts/delete/:id", clientAuthApi, ClientApiController.deleteContact);

/* ===========================
   MESSAGING (CLIENT)
=========================== */

/**
 * @swagger
 * /api/client/chats:
 *   get:
 *     summary: Get all chat conversations for the logged-in client
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat list retrieved successfully
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
 *                   example: "Chat list fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "67110f0c9b47b2001f83e8f1"
 *                       freelancerId:
 *                         type: string
 *                         example: "67110f0c9b47b2001f83e8a9"
 *                       jobId:
 *                         type: string
 *                         example: "67110f0c9b47b2001f83e8b5"
 *                       lastMessage:
 *                         type: string
 *                         example: "Looking forward to working with you!"
 *                       updatedAt:
 *                         type: string
 *                         example: "2025-10-16T17:23:45.120Z"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// List all chats for client
router.get("/chats", clientAuthApi, MessageApiController.getChatList);


/**
 * @swagger
 * /api/client/chats/{userId}/{jobId}:
 *   get:
 *     summary: Get conversation between client and freelancer for a specific job
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
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
router.get("/chats/:userId/:jobId", clientAuthApi, MessageApiController.getConversation);


/**
 * @swagger
 * /api/client/chat/history:
 *   get:
 *     summary: Get chat history between two users for a specific job
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
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
router.get("/chat/history", clientAuthApi, MessageApiController.getChatHistory);

module.exports = router;
