var express         = require('express')
  , app             = express()
  , mongoose        = require('mongoose')
  , bodyParser      = require('body-parser')
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local')
  , session         = require('express-session')
  , User            = require('./models/user')
  , Log             = require('./models/log')
  , flash           = require('connect-flash')
  , routes          = require('./routes')
;

require('dotenv').config();
// Auth config
app.use(flash());
app.use(session({
    secret: 'gibberish',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// Auth end

mongoose.connect(process.env.DBURL  || "mongodb://localhost:27017/timelogs", {useMongoClient: true});
mongoose.Promise = Promise;
// mongoose.set('debug', true);

// setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use("/", routes);
// setup end


app.listen(process.env.PORT || 3000, function() {
    console.log("Server running in the port: " + (process.env.PORT || 3000));
});