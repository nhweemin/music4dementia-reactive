import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const instituteSchema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  otpResetPassword: {
    type: String,
    default: null
  },
  isVerifyAuth: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
instituteSchema.index({ email: 1 });
instituteSchema.index({ uid: 1 });
instituteSchema.index({ isVerifyAuth: 1 });

// Password hashing middleware
instituteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
instituteSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate UID method
instituteSchema.methods.generateUID = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 28; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.uid = result;
  return result;
};

// Update last login
instituteSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Instance method to get public profile
instituteSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    uid: this.uid,
    email: this.email,
    name: this.name,
    isVerifyAuth: this.isVerifyAuth,
    lastLogin: this.lastLogin,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
instituteSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

instituteSchema.statics.findByUID = function(uid) {
  return this.findOne({ uid });
};

const Institute = mongoose.model('Institute', instituteSchema);

export default Institute;
