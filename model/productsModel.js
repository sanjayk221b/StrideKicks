const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: [String],
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    isListed: {
        type: Boolean,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "offer",
    },
    offerPrice: {
        type:Number,
    }

});

module.exports = mongoose.model('products', productsSchema);