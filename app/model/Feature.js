const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });

const FeatureModel= mongoose.model('feature', featureSchema);
module.exports = FeatureModel;
