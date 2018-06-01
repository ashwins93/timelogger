const express = require('express'),
  router = express.Router(),
  passport = require('passport'),
  User = require('../models/user'),
  Log = require('../models/log'),
  strftime = require('strftime'),
  path = require('path');


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
        let user = req.params.uname;
		let logins = await Log.find({ "user.username": user }, { _id: 0 }).sort({ time: -1 });
		let starCount = logins.reduce((acc, next) => {
			if (next.time.getHours() < 9 || (next.time.getHours() === 9 && next.time.getMinutes() <= 5 ) ) {
				return acc + 1;
			}
			return acc;
		}, 0);
        res.render('profile', { 
            user: user,
            logins: logins,
			starCount: starCount
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

router.get("/pivot-example", function (req, res) {
	res.sendFile(path.resolve('.', 'public', 'PivotExamples.xlsx'));
});

router.get("/random-data", function (req, res) {
	res.sendFile(path.resolve('.', 'public', 'RandomData.xlsx'));
});

router.get("/leaderboard", async function (req, res) {
	let aggregationPipeline = [ 
		{
			$project: { 
				_id:0, 
				username: "$user.username",
				hour: { 
					$hour: "$time" 
				}, 
				minutes: { 
					$minute: "$time" 
				} 
			} 
		}, 
		{ 
			$match: { 
				$or: [ 
					{
						hour: { $lt: 3 } 
					}, 
					{ 
						$and: [ 
							{hour: 3}, 
							{minutes: { $lte: 35 } }
						]
					} 
				]
			}
		}, 
		{ 
			$group: { 
				_id: "$username", 
				count: { $sum: 1 } 
			} 
		}, 
		{
			$sort:{ count:-1 }
		} 
	];
	let qMonth = Number(req.query.month) || 0;
	let qYear = Number(req.query.year) || 0;
	let title = "All time";
	if (qMonth > 0 && qMonth <= 12 && qYear > 0) {
		aggregationPipeline[0].$project.month = { $month: "$time" };
		aggregationPipeline[0].$project.year = { $year: "$time" };
		aggregationPipeline[1].$match.month = qMonth;
		aggregationPipeline[1].$match.year = qYear;
		title = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"][qMonth - 1];
		title += " " + qYear;
	}
	console.log(aggregationPipeline);
	let data = await Log.aggregate(aggregationPipeline);
	res.render("leaderboard", { users: data, title: title });
});


// All routes go above this line

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