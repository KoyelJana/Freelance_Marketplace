const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  image: { type: String }
}, { timestamps: true });

const BannerModel=mongoose.model("banner", BannerSchema);
module.exports =BannerModel;