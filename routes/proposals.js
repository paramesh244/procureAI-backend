const express = require('express');

const router = express.Router();
const ai = require('../services/aiService');

const RFP = require('../models/rfp');

const Proposal = require('../models/Proposal');
const mongoose = require('mongoose');





router.get('/inbox', async (req, res) => {

  try{
    // const proposals = await Proposal.find().populate('vendorId').populate('rfpId');
     const proposals = await Proposal.find().populate('vendorId')
    if (!proposals || proposals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No proposals found'
      });
    }

    res.json(proposals);
  }
    catch(err){
        res.status(500).json({ error: err.message });     
    }
});



//get all proposals for rfp
router.get('/:id', async (req, res) => {
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

//compare proposals

// router.get('/:id/comparison', async (req, res) => {
//   const rfp = await RFP.findById(req.params.id);
//   const proposals = await Proposal.find({ rfpId: req.params.id }).populate('vendorId');
//   if (!proposals || proposals.length === 0) {
//     return res.status(404).json({
//       success: false,
//       message: 'No proposals found for this RFP'
//     });
//   }
//   const parsed = proposals.map(p => ({
//     vendorId: p.vendorId._id.toString(),
//     vendorName: p.vendorId.name,
//     price: p.price,
//     delivery: p.delivery,
//     warranty: p.warranty,
//     parsed_data: p.parsed_data
//   }));
//   const aiRes = await ai.compareProposals(rfp, parsed);
//   if(!aiRes){
//     return res.status(500).json({
//       success: false,
//       message: 'AI comparison failed'
//     });
//   }
//   res.json({ proposals: parsed, analysis: aiRes });
// });

router.get('/:id/comparison', async (req, res) => {
  try {
    const rfpId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(rfpId)) {
      return res.status(400).json({ success: false, message: "Invalid RFP ID" });
    }

    // Fetch RFP + proposals in parallel
    const [rfp, proposals] = await Promise.all([
      RFP.findById(rfpId),
      Proposal.find({ rfpId }).populate('vendorId', 'name') // only fetch needed vendor fields
    ]);

    if (!rfp) {
      return res.status(404).json({ success: false, message: "RFP not found" });
    }

    if (!proposals || proposals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No proposals found for this RFP"
      });
    }

    if (proposals.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least two proposals are required for comparison",
        proposals
      });
    }

    const structuredProposals = proposals.map(p => ({
      vendorId: p.vendorId._id.toString(),
      vendorName: p.vendorId.name,
      price: p.price ?? null,
      delivery: p.delivery ?? null,
      warranty: p.warranty ?? null,
      terms: p.parsed_data?.terms ?? null,
      parsed_data: p.parsed_data ?? {}
    }));


    const aiRes = await ai.compareProposals(rfp.toObject(), structuredProposals);

    if (!aiRes || typeof aiRes !== "object") {
      return res.status(500).json({
        success: false,
        message: "AI comparison failed",
        analysis: null
      });
    }

    return res.json({
      success: true,
      proposals: structuredProposals,
      analysis: aiRes
    });

  } catch (err) {
    console.error("Comparison error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
});




module.exports = router;