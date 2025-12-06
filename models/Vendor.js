const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact_person: String,
    phone: String,
    tags: [String],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Vendor', vendorSchema);
