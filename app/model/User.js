const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["freelancer", "client"],
        default: "freelancer"
    },

    // Profile fields
    avatar: { type: String, default: "/frontend/images/Blanck_avatar.webp" },
    bio: { type: String, default: "" },
    skills: [{ type: String }],
    rating: { type: Number, default: 0 }
}, {
    timestamps: true
})

const UserModel = mongoose.model('user', UserSchema)
module.exports = UserModel