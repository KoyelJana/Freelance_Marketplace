const express = require("express");
const JobController = require("../../controller/client/JobController");
const clientAuth = require("../../middleware/clientAuth");
const Image = require("../../helper/Image");
const router = express.Router();


router.get("/", clientAuth, JobController.list);


// Client routes
router.get("/create/new", clientAuth, JobController.createForm);
router.post("/create", clientAuth, Image.single('image'), JobController.create);

router.get("/:id", clientAuth, JobController.details);

router.get("/edit/:id", clientAuth, JobController.editForm);
router.post("/update/:id", clientAuth, Image.single('image'), JobController.update);

router.post("/delete/:id", clientAuth, JobController.delete);

module.exports = router;
