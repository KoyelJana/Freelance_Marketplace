const express = require("express");
const BidController = require("../../controller/frontend/BidController");
const requireLogin = require("../../middleware/requireLogin");
const router = express.Router();

router.get('/submit/:jobId', requireLogin, (req, res) => {
    res.render('frontend/Job_details', { freelancer: req.session.freelancer });
});
// Submit bid (freelancer)
router.post("/submit/:jobId",requireLogin, BidController.submitBid);

module.exports = router;
