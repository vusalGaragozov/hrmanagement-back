// Define the schema for your MongoDB collection
const mongoose = require('mongoose');
const { format, parse } = require('date-fns');

const staffMemberSchema = new mongoose.Schema({
  addedBy_company: String,
  addedBy_email: String,
  temporaryPassword: String,
  personalInfo: {
    name: String,
    surname: String,
    fatherName: String,
    gender: String,
    profilePicture: {
      data: Buffer, // Binary image data
      contentType: String, // Mime type of the image (e.g., image/jpeg)
    },
    birthDate: {
      type: Date,
      set: (v) => {
        const parsedDate = parse(v, 'dd-MM-yyyy', new Date());
        if (parsedDate instanceof Date && !isNaN(parsedDate)) {
          return parsedDate;
        }
        return null; // Return null for invalid dates
      },
      default: null, // or specify a default date if needed
    },
    FINCode: String,
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
    email: String,
   
  },
  corporateInfo: {
    lineManager: String,
    position: String,
    grossSalary: Number,
    field: String,
    startDate: {
      type: Date,
      set: (v) => {
        const parsedDate = parse(v, 'dd-MM-yyyy', new Date());
        if (parsedDate instanceof Date && !isNaN(parsedDate)) {
          return parsedDate;
        }
        return null; // Return null for invalid dates
      },
      default: null, // or specify a default date if needed
    },
    annualLeaveDays: Number,
    contractDuration: Number,
    weeklyWorkingHours: Number,
  },
});

// Create a model based on the schema
const StaffMember = mongoose.model('StaffMember', staffMemberSchema);

module.exports = StaffMember;
