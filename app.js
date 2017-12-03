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
// setup end

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true
}), function(req, res) {
    res.redirect(`/users/${req.user.username}`);
});

app.get("/users/checkin", isLoggedIn, async function(req, res) {
    try {
        var user = await User.findByUsername(req.user.username).populate('logins').exec();
        var logs = user.logins;
        if(logs.some(function(log) {
            return log.time.toDateString() === new Date().toDateString();
        })) {
            req.flash('error', "You've already checked in today");
            return res.redirect('back');
        }
        var newLog = await Log.create({
            user: {
                id: user._id,
                username: user.username
            }
        });
        user.logins.push(newLog);
        user.save();
        res.redirect(`/users/${req.user.username}`)
    } catch(err) {
        console.error(err);
        req.flash('error', 'Sorry, could not check you in');
        res.redirect('/');
    }
});

app.get("/users/new", isLoggedIn, isAdmin, function(req, res) {
    res.render("newuser");
});

app.get("/users/change", isLoggedIn, function(req, res) {
    res.render("changepwd");
});

app.get("/users/:uname", async function(req, res) {
    try {
        var user = await User.findOne({
            username: req.params.uname
        }).populate('logins').exec();
        res.render('profile', { 
            user: user.username,
            logins: user.logins 
        });
    } catch (err) {
        console.error(err);
        res.redirect('back');
    }
});

app.get("/dashboard", isLoggedIn, isAdmin, async function(req, res) {
    let logs = await Log.find();
    let users = await User.find();
    res.render("dashboard", { users: users, logins: logs });
});

app.post('/users', isLoggedIn, isAdmin,  function(req, res) {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/users/new");
            }
            if (req.body.isAdmin) {
                user.isAdmin = true;
                user.save();
            }        
            req.flash("success", `${user.username}'s account created succesfully`);
            res.redirect(`/users/${user.username}`);
        }
    );
    
});

app.post('/users/change', isLoggedIn, async function(req, res) {
    try {
        let user = await User.findByUsername(req.user.username);
        user.setPassword(req.body.password, function(){
            user.save();
            req.flash('success', 'Password changed!');
            res.redirect(`/users/${user.username}`);
        });
    } catch(err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('back');
    }
});

app.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "You have logged out");
    res.redirect("/");
});

app.get("*", function(req, res) {
    res.status(404).send("Page not found");
})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server running in the port: " + (process.env.PORT || 3000));
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You have to be logged in!");
    res.redirect("/");
}

function isAdmin(req, res, next) {
    if(req.user.isAdmin) {
        return next();
    }
    req.flash("error", "Sorry only an administrator can do that");
    res.redirect("back");
}