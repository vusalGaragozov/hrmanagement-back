const mongoose = require('mongoose');

const ebitdaSchema = new mongoose.Schema({
    Entity: {
        type: String,
        required: true
    },
    Planned: {
        type: Number,
        required: true
    },
    Actual: {
        type: Number,
        required: true
    }
});

const EBITDA = mongoose.model('EBITDA', ebitdaSchema);

module.exports = EBITDA;
