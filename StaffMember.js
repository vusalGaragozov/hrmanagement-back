// Define the schema for your MongoDB collection
const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema({
  addedBy_company: String,
  addedBy_email: String,
  personalInfo: {
    name: String,
    surname: String,
    fatherName: String,
    gender: String,
    birthDate: {
      type: Date,
      get: (v) => (v ? require('date-fns').format(v, 'dd-MM-yyyy') : null), // Format date when getting from the database
      set: (v) => (v ? require('date-fns').parse(v, 'dd-MM-yyyy', new Date()) : null), // Parse date when setting to the database
    },
    FINCode: String,
    email: String,
  },
  corporateInfo: {
    department: String,
    position: String,
    grossSalary: Number,
    field: String,
    startDate: {
      type: Date,
      get: (v) => (v ? require('date-fns').format(v, 'dd-MM-yyyy') : null),
      set: (v) => (v ? require('date-fns').parse(v, 'dd-MM-yyyy', new Date()) : null),
    },
    annualLeaveDays: Number,
    contractDuration: String,
    weeklyWorkingHours: String,
  },
});

// Create a model based on the schema
const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

module.exports = StaffMember;
