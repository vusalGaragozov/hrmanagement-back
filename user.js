const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phoneNumberPrefix: {
    type: String,
    required: true,
    trim: true,
    enum: ['050', '051', '055', '070'], // Add your prefix options
  },
  phoneNumberDigits: {
    type: String,
    required: true,
    trim: true,
    match: /^\d{3}-\d{2}-\d{2}$/,
  },
  organization: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
