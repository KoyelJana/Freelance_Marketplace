const express=require('express');
const FrontendController = require('../../controller/frontend/FrontendController');
const router=express.Router();

//home page
router.get('/',FrontendController.homePage);

//about page
router.get('/about',FrontendController.aboutPage);

//feature page
router.get('/features',FrontendController.feturesPage);

//job board page
router.get('/job_board',FrontendController.jobBoardPage);

// Job detail page
router.get("/job/:id",FrontendController.jobDetail);

//contact page
router.get("/contact",FrontendController.contactPage);
router.post('/contact/create',FrontendController.createContactUs);

module.exports=router;