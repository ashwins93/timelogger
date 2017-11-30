var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    logins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Log'
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    }
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);