const mongoose = require('mongoose');

const vacationSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  paymentTiming: String,
  selectedOption: String,
  selectedOptionsign: String,
});

const Vacation = mongoose.model('Vacation', vacationSchema);

module.exports = Vacation;
