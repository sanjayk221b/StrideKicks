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
    address: [
        {
            name: {
                type: String,
            },
            houseName: {
                type: String,
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            mobile: {
                type: Number,
            },
            pincode: {
                type: Number,
            },
        },
    ],
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
    },
    token: {
        type: String,
        default: ''
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model("user", userSchema)