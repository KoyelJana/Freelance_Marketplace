const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  image: { type: String }
}, { timestamps: true });

const AboutModel=mongoose.model("about", aboutSchema);
module.exports =AboutModel;