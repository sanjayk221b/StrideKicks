const mongoose = require('mongoose');

const offerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
    
      startingDate: {
        type: Date,
        required: true,
      },
    
      expiryDate: {
        type: Date,
        required: true,
      },
    
      percentage: {
        type: Number,
        required: true,
      },
      status: {
        type: Boolean,
        default: true,
      },
});


module.exports = mongoose.model('offer',offerSchema);