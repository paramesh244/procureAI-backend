const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  specifications: String
});

const RfpSchema = new mongoose.Schema({
  title: String,
  description: String,
  budget: Number,
  delivery_timeline: String,
  items: [ItemSchema],
  payment_terms: String,
  warranty: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('RFP', RfpSchema);
