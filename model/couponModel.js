const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        default: 'Active'
    },
    usersClaimed: [{
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "user"
        }
    }]
}, { timestamps: true })



module.exports = mongoose.model('coupon', couponSchema);