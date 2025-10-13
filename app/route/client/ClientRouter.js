const express = require('express');
const ClientController = require('../../controller/client/ClientController');
const clientAuth = require('../../middleware/clientAuth');
const Image = require('../../helper/Image');
const MessageController = require('../../controller/MessageController');
const router = express.Router();

router.get('/register', ClientController.ClientRegister)
router.post('/register/create', ClientController.ClientRegisterCreate)

router.get('/verify_otp', ClientController.verifiotpForm)
router.post('/verify_otp/create', ClientController.verifiotp)

router.get('/login', ClientController.ClientLogin)
router.post('/login/create', ClientController.ClientLoginCreate)

router.get('/forgot_password_link', ClientController.forgotPasswordLinkForm);
router.post('/forgot_password_link/create', ClientController.forgotPasswordLink);

router.get('/reset_password/:id/:token', ClientController.resetPasswordForm);
router.post('/reset_password/:id/:token', ClientController.resetPassword);

router.get('/dashboard', clientAuth, ClientController.Clientdashboard)

// Profile Page
router.get("/profile", clientAuth, ClientController.getProfile);

// Profile edit + update with avatar upload
router.get("/edit/:id", clientAuth, ClientController.editClient);
router.post("/update/:id", clientAuth, Image.single("avatar"), ClientController.updateClient);

//logout
router.get('/logout', clientAuth, ClientController.ClientLogout);

//manage bid\\
// View bids for a job (client)
router.get("/bids/job/:jobId", clientAuth, ClientController.jobBids);
// Accept a bid (client)
router.post("/bids/accept/:id", clientAuth, ClientController.acceptBid);
// Reject a bid (client)
router.post("/bids/reject/:id", clientAuth, ClientController.rejectBid);
//get all bid
router.get("/all_bids", clientAuth, ClientController.getAllBids);

//banner
router.get("/banner", clientAuth,ClientController.BannerList);
router.get("/banner/add", clientAuth,ClientController.addBannerForm);
router.post("/banner/add", clientAuth,Image.single("image"), ClientController.createBanner);
router.get("/banner/edit/:id", clientAuth,ClientController.editBannerForm);
router.post("/banner/edit/:id", clientAuth,Image.single("image"), ClientController.updateBanner);
router.post("/banner/delete/:id", clientAuth,ClientController.deleteBanner);

//about
router.get("/about", clientAuth,ClientController.aboutList);
router.get("/about/add", clientAuth,ClientController.addAboutForm);
router.post("/about/add", clientAuth,Image.single("image"), ClientController.createAbout);
router.get("/about/edit/:id", clientAuth,ClientController.editAboutForm);
router.post("/about/edit/:id", clientAuth,Image.single("image"), ClientController.updateAbout);
router.post("/about/delete/:id", clientAuth,ClientController.deleteAbout);

//features
router.get("/features", clientAuth,ClientController.listFeatures);
router.get("/features/add", clientAuth,ClientController.addFeature);
router.post("/features/add", clientAuth, ClientController.createFeature);
router.get("/features/edit/:id", clientAuth,ClientController.editFeature);
router.post("/features/edit/:id", clientAuth, ClientController.updateFeature);
router.post("/features/delete/:id", clientAuth,ClientController.deleteFeature);

//Contact Us
router.get('/all_contact', clientAuth, ClientController.contactList)
router.get('/contact/delete/:id', clientAuth, ClientController.deleteContact)


//message
// Show all chats for client
router.get("/chats", clientAuth, MessageController.getChatList);

// Open conversation with a freelancer for a job
router.get("/chat/:userId/:jobId", clientAuth, MessageController.getConversation);

// API to fetch chat history (optional for AJAX)
router.get("/chat/history", clientAuth, MessageController.getChatHistory);


module.exports = router