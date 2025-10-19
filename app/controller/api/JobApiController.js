const JobModel = require("../../model/Job");
const { Validator } = require("node-input-validator");
const path = require("path");
const fs = require("fs");

class JobController {
  /* =============================
     GET /api/client/jobs
     Show all jobs (with filters)
  ============================== */
  async list(req, res) {
    try {
      const { skill, minBudget, maxBudget, status } = req.query;

      let filter = {};
      if (skill) filter.skills = skill;
      if (status) filter.status = status;
      if (minBudget || maxBudget) {
        filter.budget = {};
        if (minBudget) filter.budget.$gte = Number(minBudget);
        if (maxBudget) filter.budget.$lte = Number(maxBudget);
      }

      const jobs = await JobModel.find(filter).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        message: "Jobs fetched successfully",
        count: jobs.length,
        data: jobs,
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching jobs",
      });
    }
  }

  /* =============================
     GET /api/client/jobs/:id
     Get single job details
  ============================== */
  async details(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Job details fetched successfully",
        data: job,
      });
    } catch (error) {
      console.error("Error fetching job details:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching job details",
      });
    }
  }

  /* =============================
     POST /api/client/jobs
     Create new job
  ============================== */
  async create(req, res) {
    try {
      const v = new Validator(req.body, {
        title: "required|string|minLength:3",
        description: "required|string|minLength:10",
        skills: "required|string",
        budget: "required|numeric",
        deadline: "required|date",
      });

      const matched = await v.check();
      if (!matched) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: v.errors,
        });
      }

      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "You must be logged in to post a job",
        });
      }

      const image = req.file ? `/uploads/${req.file.filename}` : "";

      const job = await JobModel.create({
        title: req.body.title,
        description: req.body.description,
        skills: req.body.skills.split(",").map((s) => s.trim()),
        budget: Number(req.body.budget),
        deadline: new Date(req.body.deadline),
        clientId: req.user._id,
        image,
      });

      return res.status(201).json({
        success: true,
        message: "Job posted successfully",
        data: job,
      });
    } catch (error) {
      console.error("Job creation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to post job",
      });
    }
  }

  /* =============================
     PUT /api/client/jobs/:id
     Update job details
  ============================== */
  async update(req, res) {
    try {
      const { id } = req.params;

      const v = new Validator(req.body, {
        title: "string|minLength:3",
        description: "string|minLength:10",
        skills: "string",
        budget: "numeric",
        deadline: "date",
        status: "string|in:open,in_progress,completed,closed",
      });

      const matched = await v.check();
      if (!matched) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: v.errors,
        });
      }

      const job = await JobModel.findById(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      if (job.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized action",
        });
      }

      // Delete old image if new uploaded
      if (req.file && job.image) {
        const imageFileName = path.basename(job.image);
        const imagePath = path.join(__dirname, "../../../uploads", imageFileName);
        fs.unlink(imagePath, (err) => {
          if (err) console.log("Failed to delete old image");
          else console.log("Old image deleted successfully");
        });
      }

      const updateData = {
        title: req.body.title || job.title,
        description: req.body.description || job.description,
        skills: req.body.skills
          ? req.body.skills.split(",").map((s) => s.trim())
          : job.skills,
        budget: req.body.budget || job.budget,
        deadline: req.body.deadline || job.deadline,
        status: req.body.status || job.status,
      };

      if (req.file) updateData.image = `/uploads/${req.file.filename}`;

      const updatedJob = await JobModel.findByIdAndUpdate(id, updateData, { new: true });

      return res.status(200).json({
        success: true,
        message: "Job updated successfully",
        data: updatedJob,
      });
    } catch (error) {
      console.error("Job update error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update job",
      });
    }
  }

  /* =============================
     DELETE /api/client/jobs/:id
     Delete job
  ============================== */
  async delete(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      if (job.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized action",
        });
      }

      // Delete image if exists
      if (job.image) {
        const imageFileName = path.basename(job.image);
        const imagePath = path.join(__dirname, "../../../uploads", imageFileName);
        fs.unlink(imagePath, (err) => {
          if (err) console.log("Failed to delete image");
          else console.log("Old image deleted successfully");
        });
      }

      await JobModel.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      console.error("Job delete error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to delete job",
      });
    }
  }
}

module.exports = new JobController();
