var User = require('./models/user');
var mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.DBURL, {useMongoClient: true});
mongoose.Promise = Promise;
User.register(
    new User({ username: 'admin' }),
    'password',
    function (err, user) {
        if (err) {
            console.error(err)
            return;
        }
        user.isAdmin = true;
        user.save();
        console.log('user created!');
        return;
    }
);
