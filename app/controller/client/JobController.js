const JobModel = require("../../model/Job");
const { Validator } = require("node-input-validator");
const path = require("path");
const fs = require("fs");

class JobController {
  // Show all jobs (with optional filters)
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

      res.render("client/All_job", {
        title: "Job Listings",
        jobs,
        user: req.user,
        message: req.flash("message"),
      });
    } catch (error) {
      console.error(error);
      req.flash("message", "Unable to load jobs");
      res.redirect("/client/dashboard");
    }
  }

  // Show job details
  async details(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        req.flash("message", "Job not found");
        return res.redirect("/jobs");
      }
      res.render("client/Job_Individual_details", {
        title: job.title,
        job,
        user: req.user,
        message: req.flash("message"),
      });
    } catch (error) {
      console.error(error);
      req.flash("message", "Unable to load job details");
      res.redirect("/jobs");
    }
  }

  // Create job form
  async createForm(req, res) {
    try {
      res.render("client/Job_create", {
        title: "Post a Job",
        user: req.user,
        message: req.flash("message"),
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Create job with validation
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
        req.flash("message", Object.values(v.errors).map(e => e.message).join(", "));
        return res.redirect("/jobs/create");
      }

      const { title, description, skills, budget, deadline } = req.body;

      if (!req.user || !req.user._id) {
        req.flash("message", "You must be logged in to post a job");
        return res.redirect("/client/login");
      }

      const image = req.file ? `/uploads/${req.file.filename}` : '';

      await JobModel.create({
        title,
        description,
        skills: skills.split(",").map(s => s.trim()),
        budget: Number(budget),
        deadline: new Date(deadline),
        clientId: req.user._id,
        image,
      });

      req.flash("message", "Job posted successfully");
      res.redirect("/jobs");
    } catch (error) {
      console.error("Job creation error:", error);
      req.flash("message", "Failed to post job. Check console for details.");
      res.redirect("/jobs/create");
    }
  }

  // Edit job form
  async editForm(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        req.flash("message", "Job not found");
        return res.redirect("/jobs");
      }

      if (job.clientId.toString() !== req.user._id.toString()) {
        req.flash("message", "Unauthorized access");
        return res.redirect("/jobs");
      }

      res.render("client/Job_edit", {
        title: "Edit Job",
        user: req.user,
        job,
        message: req.flash("message"),
      });
    } catch (error) {
      console.error(error);
      req.flash("message", "Unable to load job for editing");
      res.redirect("/jobs");
    }
  }

  // Update job with validation
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
        req.flash("message", Object.values(v.errors).map(e => e.message).join(", "));
        return res.redirect(`/jobs/${id}/edit`);
      }

      const job = await JobModel.findById(id);
      if (!job) {
        req.flash("message", "Job not found");
        return res.redirect("/jobs");
      }

      if (job.clientId.toString() !== req.user._id.toString()) {
        req.flash("message", "Unauthorized action");
        return res.redirect("/jobs");
      }

      if (req.file && job.image) {
        const imageFileName = path.basename(job.image);
        const imagePath = path.join(__dirname, '..', '..', '..', 'uploads', imageFileName);
        fs.unlink(imagePath, (err) => {
          if (err) console.log("Failed to delete old image");
          else console.log("Old image deleted successfully");
        });
      }

      const { title, description, skills, budget, deadline, status } = req.body;

      job.title = title || job.title;
      job.description = description || job.description;
      job.skills = skills ? skills.split(",").map(s => s.trim()) : job.skills;
      job.budget = budget || job.budget;
      job.deadline = deadline || job.deadline;
      job.status = status || job.status;

      if (req.file) job.image = `/uploads/${req.file.filename}`;

      await job.save();

      req.flash("message", "Job updated successfully");
      res.redirect("/jobs");
    } catch (error) {
      console.error(error);
      req.flash("message", "Unable to update job");
      res.redirect("/jobs");
    }
  }

  // Delete job
  async delete(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        req.flash("message", "Job not found");
        return res.redirect("/jobs");
      }

      if (job.clientId.toString() !== req.user._id.toString()) {
        req.flash("message", "Unauthorized action");
        return res.redirect("/jobs");
      }

      if (job.image) {
        const imageFileName = path.basename(job.image);
        const imagePath = path.join(__dirname, '..', '..', '..', 'uploads', imageFileName);
        fs.unlink(imagePath, (err) => {
          if (err) console.log("Failed to delete old image");
          else console.log("Old image deleted successfully");
        });
      }

      await JobModel.findByIdAndDelete(req.params.id);
      req.flash("message", "Job deleted successfully");
      res.redirect("/jobs");
    } catch (error) {
      console.error(error);
      req.flash("message", "Unable to delete job");
      res.redirect("/jobs");
    }
  }
}

module.exports = new JobController();
