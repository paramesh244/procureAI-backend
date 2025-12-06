const router = require('express').Router();
const Vendor = require('../models/Vendor');
const mongoose = require('mongoose');
const Joi = require('joi');


const validateVendor = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  contact_person: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  tags: Joi.array().items(Joi.string()).optional()
 
});

router.post('/add', async (req, res) => {
  try {
    const { error } = validateVendor.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    const vendor = new Vendor(req.body);
    const savedVendor = await vendor.save();
    return res.status(201).json({
      success: true,
      data: savedVendor
    });
  } catch (err) {
    console.error('Error adding vendor:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();

    if (!vendors || vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vendors found'
      });
    }

    return res.json({
      success: true,
      data: vendors
    });

  } catch (err) {
    console.error('Error fetching vendors:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedVendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!deletedVendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting vendor:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

//update vendor

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor id' });
    }

    // Whitelist fields that can be updated
    const allowed = ['name', 'email', 'contact_person', 'phone', 'notes'];
    const updates = {};
    
    for (const key of allowed) {
      if (req.body[key] !== undefined) 
      updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

  
    const updatedVendor = await Vendor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: 'query' // needed for some validators to work on update
    });

    if (!updatedVendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    return res.json({ success: true, data: updatedVendor });
  } catch (err) {
    console.error('Error updating vendor:', err);

    if (err.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: err.errors });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
