const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  isLoggedOut: {
    type: Boolean,
    default: false, 
  },
  verifyForgotCode: {
    type: String,
  },
  userToken: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false
  },
  isForceLogout:{
    type: Boolean,
    default: false
  },
  isDelete: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = User = mongoose.model('user', UserSchema, 'users');