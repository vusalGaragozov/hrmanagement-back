// Define the schema for your MongoDB collection
const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    surname: String,
    fatherName: String,
    gender: String,
    birthDate: Date,
    FINCode: String,
    email: String,
  },
  corporateInfo: {
    department: String,
    position: String,
    grossSalary: Number,
    field: String,
    startDate: Date,
    annualLeaveDays: Number,
    contractDuration: String,
    weeklyWorkingHours: String,
  },
});

// Create a model based on the schema
const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

module.exports = StaffMember;
