const mongoose = require('mongoose');

const vacationSchema = new mongoose.Schema({
  userFullName: String,
  userEmail: String,
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  paymentTiming: String,
  selectedOptionLabel: String,
  lineManagerEmail: String,
  selectedOptionsignLabel: String,
  directorEmail: String,
  userFullName: String,
});

const Vacation = mongoose.model('Vacation', vacationSchema);

module.exports = Vacation;