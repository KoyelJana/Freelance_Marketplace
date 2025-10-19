const express=require('express');
const FrontendApiController = require('../../controller/api/FrontendApiController');
const router=express.Router();


/**
 * @swagger
 * /api/:
 *  get:
 *    summary: Get all the home page data from Database
 *    tags:
 *       - Frontend
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
//home page
router.get('/',FrontendApiController.homePage);


/**
 * @swagger
 * /api/about:
 *  get:
 *    summary: Get all the about data from Database
 *    tags:
 *       - Frontend
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
//about page
router.get('/about',FrontendApiController.aboutPage);



/**
 * @swagger
 * /api/features:
 *  get:
 *    summary: Get all the features data from Database
 *    tags:
 *       - Frontend
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
//feature page
router.get('/features',FrontendApiController.featuresPage);


/**
 * @swagger
 * /api/job_board:
 *  get:
 *    summary: Get all the job_board data from Database
 *    tags:
 *       - Frontend
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
//job board page
router.get('/job_board',FrontendApiController.jobBoardPage);



/**
 * @swagger
 * /api/job/{id}:
 *   get:
 *     summary: Get job detail by ID
 *     tags:
 *       - Frontend
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the job
 *         schema:
 *           type: string
 *           example: "64fd9c123456abcdef7890"
 *     responses:
 *       '200':
 *         description: Job detail fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64fd9c123456abcdef7890"
 *                 title:
 *                   type: string
 *                   example: "Full Stack Developer"
 *                 description:
 *                   type: string
 *                   example: "This is a full stack developer job"
 *                 budget:
 *                   type: number
 *                   example: 3000
 *       '404':
 *         description: Job not found
 */
// Job detail page
router.get("/job/:id",FrontendApiController.jobDetail);


/**
 * @swagger
 * /api/contact:
 *  get:
 *    summary: Get all the contact data from Database
 *    tags:
 *       - Frontend
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
//contact page
router.get("/contact",FrontendApiController.contactPage);


/**
 * @swagger
 * /api/contact/create:
 *   post:
 *     summary: Submit contact form
 *     tags:
 *       - Frontend
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: Contact
 *         description: Add contact message in MongoDB and send email.
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - message
 *           properties:
 *             name:
 *               type: string
 *               example: "Koyel Jana"
 *             email:
 *               type: string
 *               example: "koyel@example.com"
 *             message:
 *               type: string
 *               example: "I want to know more about your services."
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request, missing or invalid parameters
 *       500:
 *         description: Failed to send message
 */
router.post('/contact/create',FrontendApiController.createContactUs);

module.exports=router;