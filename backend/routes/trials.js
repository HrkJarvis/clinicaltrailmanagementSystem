const express = require('express');
const { body, validationResult, query } = require('express-validator');
const ClinicalTrial = require('../models/ClinicalTrial');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Validators
const trialValidation = [
  body('trialName').isLength({ min: 1, max: 200 }).withMessage('Invalid trialName').trim(),
  body('trialId').isLength({ min: 1, max: 50 }).matches(/^[A-Z0-9-]+$/).withMessage('Invalid trialId').trim(),
  body('description').isLength({ min: 1, max: 2000 }).withMessage('Invalid description').trim(),
  body('principalInvestigator').isLength({ min: 1, max: 100 }).withMessage('Invalid PI').trim(),
  body('sponsor').isLength({ min: 1, max: 200 }).withMessage('Invalid sponsor').trim(),
  body('phase').isIn(['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV']).withMessage('Invalid phase'),
  body('status').optional().isIn(['Planning', 'Active', 'Recruiting', 'Suspended', 'Completed', 'Terminated']).withMessage('Invalid status'),
  body('startDate').isISO8601().toDate().withMessage('Invalid startDate'),
  body('endDate').isISO8601().toDate().withMessage('Invalid endDate').custom((v, { req }) => { if (v <= req.body.startDate) throw new Error('End date must be after start date'); return true; }),
  body('estimatedEnrollment').isInt({ min: 1, max: 100000 }).withMessage('Invalid estimatedEnrollment'),
  body('actualEnrollment').optional().isInt({ min: 0 }).withMessage('Invalid actualEnrollment').custom((v, { req }) => { if (v > req.body.estimatedEnrollment) throw new Error('Actual > Estimated'); return true; }),
  body('primaryEndpoint').isLength({ min: 1, max: 500 }).withMessage('Invalid primaryEndpoint').trim(),
  body('therapeuticArea').isLength({ min: 1, max: 100 }).withMessage('Invalid therapeuticArea').trim(),
  body('drugName').optional().isLength({ max: 100 }).withMessage('Invalid drugName').trim(),
];

// GET /api/trials (list with filters + pagination)
router.get('/', isAuthenticated, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Planning', 'Active', 'Recruiting', 'Suspended', 'Completed', 'Terminated']),
  query('phase').optional().isIn(['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', messages: errors.array().map(e => e.msg) });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.phase) filter.phase = req.query.phase;
    if (req.query.therapeuticArea) filter.therapeuticArea = new RegExp(req.query.therapeuticArea, 'i');
    if (req.query.search) {
      const r = new RegExp(req.query.search, 'i');
      filter.$or = [ { trialName: r }, { trialId: r }, { description: r }, { principalInvestigator: r }, { sponsor: r }, { therapeuticArea: r }, { drugName: r } ];
    }
    if (req.user.role !== 'admin') filter.createdBy = req.user._id;

    const [trials, totalTrials] = await Promise.all([
      ClinicalTrial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ClinicalTrial.countDocuments(filter)
    ]);

    res.json({
      trials,
      pagination: { currentPage: page, totalPages: Math.ceil(totalTrials / limit), totalTrials, hasNextPage: page * limit < totalTrials, hasPrevPage: page > 1 }
    });
  } catch (err) {
    console.error('Get trials error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve clinical trials' });
  }
});

// GET /api/trials/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const t = await ClinicalTrial.findById(req.params.id).populate('createdBy', 'firstName lastName username');
    if (!t) return res.status(404).json({ error: 'Trial Not Found', message: 'Clinical trial not found' });
    if (req.user.role !== 'admin' && String(t.createdBy._id || t.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden', message: 'No access' });
    res.json({ trial: t });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID', message: 'Invalid trial ID format' });
    console.error('Get trial error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve clinical trial' });
  }
});

// POST /api/trials
router.post('/', isAuthenticated, trialValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', messages: errors.array().map(e => e.msg) });

    const existing = await ClinicalTrial.findOne({ trialId: req.body.trialId.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Duplicate Trial ID', message: 'A trial with this ID already exists' });

    const t = new ClinicalTrial({ ...req.body, trialId: req.body.trialId.toUpperCase(), createdBy: req.user._id, lastModifiedBy: req.user._id });
    await t.save();
    res.status(201).json({ message: 'Clinical trial created successfully', trial: t });
  } catch (err) {
    console.error('Create trial error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create clinical trial' });
  }
});

// PUT /api/trials/:id
router.put('/:id', isAuthenticated, trialValidation, async (req, res) => {
  try {
    // Debug: log incoming payload and user
    console.log('\n=== PUT /api/trials/:id ===');
    console.log('Params:', req.params);
    console.log('User:', req.user && req.user._id);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        messages: errors.array().map(e => e.msg) 
      });
    }

    // Get current trial
    const current = await ClinicalTrial.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Clinical trial not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && String(current.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to update this trial' 
      });
    }

    // Check for duplicate trial ID if being changed
    if (req.body.trialId && req.body.trialId.toUpperCase() !== current.trialId) {
      const dup = await ClinicalTrial.findOne({ 
        trialId: req.body.trialId.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (dup) {
        return res.status(400).json({ 
          error: 'Duplicate Trial ID', 
          message: 'A trial with this ID already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle date validation
    const startDate = updateData.startDate ? new Date(updateData.startDate) : new Date(current.startDate);
    const endDate = updateData.endDate ? new Date(updateData.endDate) : new Date(current.endDate);
    
    // Reset time components for pure date comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Validate dates
    if (endDate <= startDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'End date must be at least one day after start date'
      });
    }

    // Normalize dates back into updateData so document has consistent Date objects
    updateData.startDate = startDate;
    updateData.endDate = endDate;

    // Validate enrollment numbers
    const estimatedEnrollment = updateData.estimatedEnrollment !== undefined 
      ? Number(updateData.estimatedEnrollment) 
      : current.estimatedEnrollment;
    
    if (updateData.actualEnrollment !== undefined) {
      const actualEnrollment = Number(updateData.actualEnrollment);
      
      if (actualEnrollment < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Actual enrollment cannot be negative'
        });
      }

      if (actualEnrollment > estimatedEnrollment) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Actual enrollment (${actualEnrollment}) cannot exceed estimated enrollment (${estimatedEnrollment})`
        });
      }
    }

    // Debug: show computed values before saving
    console.log('Computed/Normalized Update Data:', {
      ...updateData,
      startDate,
      endDate,
      estimatedEnrollment,
    });

    // Format trial ID to uppercase if provided
    if (updateData.trialId) {
      updateData.trialId = updateData.trialId.toUpperCase();
    }

    // Add last modified by
    updateData.lastModifiedBy = req.user._id;

    // Perform the update using document save to ensure cross-field validators run correctly
    Object.assign(current, updateData);

    // Save with validators in document context (ensures access to other fields like startDate/estimatedEnrollment)
    const saved = await current.save();

    // Re-fetch with populations for response consistency
    const updated = await ClinicalTrial.findById(saved._id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.json({ 
      message: 'Clinical trial updated successfully', 
      trial: updated 
    });

  } catch (err) {
    console.error('Update trial error:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID', 
        message: 'Invalid trial ID format' 
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.errors : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to update clinical trial',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// DELETE /api/trials/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const current = await ClinicalTrial.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Trial Not Found', message: 'Clinical trial not found' });
    if (req.user.role !== 'admin' && String(current.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden', message: 'No access' });
    await ClinicalTrial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Clinical trial deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID', message: 'Invalid trial ID format' });
    console.error('Delete trial error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete clinical trial' });
  }
});

module.exports = router;
