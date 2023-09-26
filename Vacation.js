const mongoose = require('mongoose');
const {parser} = require('date-fns');

const vacationSchema = new mongoose.Schema({

startDate: {
  type: Date,
  set: function(v) {
    const parsedDate = parse(v, 'MMM D, yyyy', new Date());
    if (parsedDate instanceof Date && !isNaN(parsedDate)) {
      return parsedDate;
    }
    return null; // Return null for invalid dates
  },
  default: null, // or specify a default date if needed
},
endDate: {
  type: Date,
  set: function(v) {
    const parsedDate = parse(v, 'MMM D, yyyy', new Date());
    if (parsedDate instanceof Date && !isNaN(parsedDate)) {
      return parsedDate;
    }
    return null; // Return null for invalid dates
  },
  default: null, // or specify a default date if needed
},
  paymentTiming: String,
  selectedOptionLabel: String,
  selectedOptionsignLabel: String,
});

const Vacation = mongoose.model('Vacation', vacationSchema);

module.exports = Vacation;
