const mongoose = require('mongoose');

const clinicalTrialSchema = new mongoose.Schema({
  trialName: {
    type: String,
    required: [true, 'Trial name is required'],
    trim: true,
    maxlength: [200, 'Trial name cannot exceed 200 characters']
  },
  trialId: {
    type: String,
    required: [true, 'Trial ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'Trial ID can only contain uppercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  principalInvestigator: {
    type: String,
    required: [true, 'Principal investigator is required'],
    trim: true,
    maxlength: [100, 'Principal investigator name cannot exceed 100 characters']
  },
  sponsor: {
    type: String,
    required: [true, 'Sponsor is required'],
    trim: true,
    maxlength: [200, 'Sponsor name cannot exceed 200 characters']
  },
  phase: {
    type: String,
    required: [true, 'Trial phase is required'],
    enum: {
      values: ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'],
      message: 'Phase must be one of: Preclinical, Phase I, Phase II, Phase III, Phase IV'
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['Planning', 'Active', 'Recruiting', 'Suspended', 'Completed', 'Terminated'],
      message: 'Status must be one of: Planning, Active, Recruiting, Suspended, Completed, Terminated'
    },
    default: 'Planning'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  estimatedEnrollment: {
    type: Number,
    required: [true, 'Estimated enrollment is required'],
    min: [1, 'Estimated enrollment must be at least 1'],
    max: [100000, 'Estimated enrollment cannot exceed 100,000']
  },
  actualEnrollment: {
    type: Number,
    default: 0,
    min: [0, 'Actual enrollment cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.estimatedEnrollment;
      },
      message: 'Actual enrollment cannot exceed estimated enrollment'
    }
  },
  primaryEndpoint: {
    type: String,
    required: [true, 'Primary endpoint is required'],
    trim: true,
    maxlength: [500, 'Primary endpoint cannot exceed 500 characters']
  },
  secondaryEndpoints: [{
    type: String,
    trim: true,
    maxlength: [500, 'Secondary endpoint cannot exceed 500 characters']
  }],
  inclusionCriteria: [{
    type: String,
    trim: true,
    maxlength: [300, 'Inclusion criteria cannot exceed 300 characters']
  }],
  exclusionCriteria: [{
    type: String,
    trim: true,
    maxlength: [300, 'Exclusion criteria cannot exceed 300 characters']
  }],
  studyLocations: [{
    facility: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Facility name cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    }
  }],
  therapeuticArea: {
    type: String,
    required: [true, 'Therapeutic area is required'],
    trim: true,
    maxlength: [100, 'Therapeutic area cannot exceed 100 characters']
  },
  drugName: {
    type: String,
    trim: true,
    maxlength: [100, 'Drug name cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
clinicalTrialSchema.index({ trialId: 1 });
clinicalTrialSchema.index({ status: 1 });
clinicalTrialSchema.index({ phase: 1 });
clinicalTrialSchema.index({ therapeuticArea: 1 });
clinicalTrialSchema.index({ createdBy: 1 });
clinicalTrialSchema.index({ startDate: 1, endDate: 1 });

// Virtual for trial duration in days
clinicalTrialSchema.virtual('durationDays').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for enrollment percentage
clinicalTrialSchema.virtual('enrollmentPercentage').get(function() {
  if (this.estimatedEnrollment > 0) {
    return Math.round((this.actualEnrollment / this.estimatedEnrollment) * 100);
  }
  return 0;
});

// Method to check if trial is active
clinicalTrialSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'Active' && 
         this.startDate <= now && 
         this.endDate >= now;
};

// Method to check if trial is overdue
clinicalTrialSchema.methods.isOverdue = function() {
  const now = new Date();
  return this.endDate < now && 
         !['Completed', 'Terminated'].includes(this.status);
};

// Static method to find trials by status
clinicalTrialSchema.statics.findByStatus = function(status) {
  return this.find({ status: status });
};

// Static method to find trials by phase
clinicalTrialSchema.statics.findByPhase = function(phase) {
  return this.find({ phase: phase });
};

// Static method to find trials by therapeutic area
clinicalTrialSchema.statics.findByTherapeuticArea = function(area) {
  return this.find({ 
    therapeuticArea: new RegExp(area, 'i') 
  });
};

// Pre-save middleware to update lastModifiedBy
clinicalTrialSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // This should be set by the controller
  }
  next();
});

const ClinicalTrial = mongoose.model('ClinicalTrial', clinicalTrialSchema);

module.exports = ClinicalTrial;
