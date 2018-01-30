const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
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

const User = mongoose.model('User', userSchema);

const express       = require('express')
  , app             = express()
  , bodyParser      = require('body-parser')
  , passport        = require('passport')
  , JWTStrategy	    = require('passport-jwt').Strategy
  , ExtractJwt      = require('passport-jwt').ExtractJwt
  , jwt				= require('jsonwebtoken')
;

mongoose.connect(process.env.DBURL  || "mongodb://localhost:27017/timelogs");
mongoose.Promise = Promise;
//mongoose.set('debug', true);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: 'honeybunny'
};
passport.use(new JWTStrategy(jwtOptions, async (payload, next) => {
	let user;
	try {
		user = await User.findByUsername(payload.username);
	} catch(err) {
		console.error(err);
	}
	if (user) {
		return next(null, user);
	}
	return next(null, false);		
}));

app.use(passport.initialize());

app.post("/login", async (req, res) => {
	let name, password;
	if(req.body.name && req.body.password){
		name = req.body.name;
		password = req.body.password;
	} else {
		return res.status(401).json({message:"no data"});
	}
	let user;
	try {
		user = await User.findByUsername(name);
	} catch(err) {
		console.error(err);
	}
	if( ! user ){
		return res.status(401).json({message:"no such user found"});
	}
	
	user.authenticate(password, (err1, user, err2) => {
		//console.log("arguments to cb: ", args);
		const err = err1 || err2;
		if(err) return res.json({message: err.message});
		const payload = {id: user.username};
		const token = jwt.sign(payload, jwtOptions.secretOrKey);
		return res.json({message: "ok", token: token});
	});
});

app.listen(3000);
