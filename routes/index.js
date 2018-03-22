const express = require('express'),
  router = express.Router(),
  passport = require('passport'),
  User = require('../models/user'),
  Log = require('../models/log'),
  strftime = require('strftime');


router.get("/", function(req, res) {
    res.render("index");
});

router.post("/", passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true
}), function(req, res) {
    res.redirect(`/users/${req.user.username}`);
});

router.get("/users/checkin", isLoggedIn, async function(req, res) {
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
        req.flash('success', "You've checked in successfully at " + strftime("%I:%M %p"));
        res.redirect(`/users/${req.user.username}`)
    } catch(err) {
        console.error(err);
        req.flash('error', 'Sorry, could not check you in');
        res.redirect('/');
    }
});

router.get("/users/new", isLoggedIn, isAdmin, function(req, res) {
    res.render("newuser");
});

router.get("/users/change", isLoggedIn, function(req, res) {
    res.render("changepwd");
});

router.get("/users/:uname", async function(req, res) {
    try {
        var user = await User.findOne({
            username: req.params.uname
        }).populate('logins').exec();
        res.render('profile', { 
            user: user.username,
            logins: user.logins.slice().sort((a, b) => b.time.getTime() - a.time.getTime()), 
        });
    } catch (err) {
        console.error(err);
        res.redirect('back');
    }
});

router.get("/dashboard", isLoggedIn, isAdmin, async function(req, res) {
	let date = new Date();
	if(req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
		date = new Date(req.query.date);
	}
	
	date.setSeconds(0);
	date.setHours(0);
	date.setMinutes(0);

	var dateMidnight = new Date(date);
	dateMidnight.setHours(23);
	dateMidnight.setMinutes(59);
	dateMidnight.setSeconds(59);
	
	let logs = await Log.find(
		{ 
			time: { 
				$gt : date,
				$lt : dateMidnight
			} 
		}
	);
	let users = await User.find();
    res.render("dashboard", { users: users, logins: logs });
});

router.post('/users', isLoggedIn, isAdmin,  function(req, res) {
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

router.post('/users/change', isLoggedIn, async function(req, res) {
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

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "You have logged out");
    res.redirect("/");
});

router.get("*", function(req, res) {
    res.status(404).send("Page not found");
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

module.exports = router;