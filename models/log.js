var mongoose = require('mongoose');

var logSchema = new mongoose.Schema({
    time: {
        type: Date,
        default: Date.now
    },
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    }
})

module.exports = mongoose.model('Log', logSchema);