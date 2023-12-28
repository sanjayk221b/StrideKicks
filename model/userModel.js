const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Number,
        default: 1
    },
    verified: {
        type: Boolean
    },
    isBlocked: {
        type: Boolean,
        default: false  
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model("user", userSchema)