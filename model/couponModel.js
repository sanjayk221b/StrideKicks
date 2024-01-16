const mongoose = require('mongoose');
const couponSchema = new mongoose.Schmema({
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
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        default: 'Active'
    },
    userUsed:[{
        userId:{
            type:ObjectId,
            ref:'user'
        }
    }]
})