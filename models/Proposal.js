const mongoose = require('mongoose');


const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number
});

const ProposalSchema = new mongoose.Schema({
  rfpId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RFP' 
    },

  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor' 
    },

  price: Number,
  delivery: String,
  warranty: String,
  terms: String,
  raw_email: Object,
  items: [ItemSchema],
  parsed_data: Object,
  createdAt: { 
    type: Date, 
    default: Date.now 
    }
});

module.exports = mongoose.model('Proposal', ProposalSchema);