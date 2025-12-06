const express = require('express');

const router = express.Router();
const ai = require('../services/aiService');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const Vendor = require('../models/Vendor');
const Proposal = require('../models/Proposal');
const RFP = require('../models/rfp');

// router.post("/create",async(req,res)=>{
//     try {

//         const {naturalLanguageDescription} = req.body;

//         const structuredRFP = await ai.toRFP(naturalLanguageDescription);
//         const newRFP = new RFP(structuredRFP);
//         await newRFP.save();

//         res.status(201).json(newRFP);

//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

router.post("/create", async (req, res) => {
  try {
    const { naturalLanguageDescription } = req.body;

    if (!naturalLanguageDescription || typeof naturalLanguageDescription !== 'string' || naturalLanguageDescription.trim().length < 10) {
      return res.status(400).json({
        error: "Invalid input. Please provide a meaningful RFP description."
      });
    }


    const structuredRFP = await ai.toRFP(naturalLanguageDescription);

    if(structuredRFP.error){
      return res.status(500).json({
        message: structuredRFP.message
      });
    }
   

    if (
      !structuredRFP ||
      !structuredRFP.title ||
      structuredRFP.title.toLowerCase().includes("unable to extract","Unspecified Procurement Request") ||
      structuredRFP.description.toLowerCase().includes("not contain discernible","The input provided is largely uninterpretable","characters appear to be random","Unspecified Procurement Request","system-generated noise")
    ) {
      return res.status(400).json({
        message: "Unable to process the input. Please provide a valid RFP description."
      });
    }

    if (!structuredRFP.items || structuredRFP.items.length === 0) {
      return res.status(400).json({
        message: "The RFP must contain at least one item."
      });
    }

    const newRFP = new RFP(structuredRFP);
    await newRFP.save();

    return res.status(201).json(newRFP);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const rfps = await RFP.find().sort({ createdAt: -1 });
      if (!rfps || rfps.length === 0) {
      return res.status(404).json({ message: 'No RFPs found' });
    }
    res.json(rfps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
)


//find rfp by id
router.get('/:id', async (req, res) => {
  try{
  const r = await RFP.findById(req.params.id);
  if (!r) {
    return res.status(404).json({ message: 'RFP not found' });
  }
  res.json(r);
  }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});



//send email

router.post('/:id/send', async (req, res) => {

    const { vendorIds } = req.body;

    const rfp = await RFP.findById(req.params.id);
    const vendors = await Vendor.find({ _id: { $in: vendorIds }});
    const html = emailService.buildRfpHtml(rfp);


    for(const v of vendors){
        await emailService.sendRfpEmail(v, rfp, html);
    }
    res.json({ message: 'Email sent to vendors' });
});




//get all proposals for rfp
router.get('/:id/proposals', async (req, res) => {
  try {
    const proposals = await Proposal.find({ rfpId: req.params.id }).populate('vendorId');
    if (!proposals || proposals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No proposals found for this RFP'
      });
    } 
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
)

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid RFP ID" });
    }

    // Whitelist fields that can be updated
    const allowed = [
      "title",
      "description",
      "budget",
      "delivery_timeline",
      "payment_terms",
      "warranty",
      "items"
    ];

    const updates = {};
    for (let key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const updated = await RFP.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: "query"
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "RFP not found" });
    }

    return res.json({ success: true, data: updated });

  } catch (err) {
    console.error("RFP update error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid RFP ID" });
    }

    const deleted = await RFP.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "RFP not found" });
    }

    return res.json({
      success: true,
      message: "RFP deleted successfully"
    });

  } catch (err) {
    console.error("Delete RFP error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});






module.exports = router;