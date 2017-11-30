var express         = require('express')
  , app             = express()
  , mongoose        = require('mongoose')
  , bodyParser      = require('body-parser')
  , passport        = require('passport')
  , LocalStrategy   = require('passport-local')
  , session         = require('express-session')
  , User            = require('./models/user')
  , flash           = require('connect-flash')
;

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

mongoose.connect(process.env.URL || "mongodb://localhost:27017/timelogs", {useMongoClient: true});
mongoose.Promise = Promise;

// setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
// setup end

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", passport.authenticate("local", {
    failureRedirect: "/"
}), function(req, res) {
    res.redirect(`/profile/${req.user.username}`);
});

app.get("/profile/:uname", function(req, res) {
    res.send(`Hello, ${req.params.uname}. Welcome to your profile`);
});

app.get("/users/new", function(req, res) {
    res.render("newuser");
});

app.post('/users', function(req, res) {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/users/new");
            }
            passport.authenticate("local")(req, res, function() {
                req.flash("success", `Welcome, ${user.username}`);
                res.send(`${user.username} created successfully!`);
            });
        }
    );
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server running in the port: " + (process.env.PORT || 3000));
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You have to be logged in!");
    res.redirect("/login");
}