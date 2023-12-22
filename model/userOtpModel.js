const mongoose = require("mongoose");
const Schema = mongoose.schema;

const UserOTPVerification = new mongoose.Schema({
    email: {
        type: String
    },
    otp: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

UserOTPVerification.index({createdAt: 1}, {expireAfterSeconds: 120})

module.exports = mongoose.model("userOtp", UserOTPVerification);

