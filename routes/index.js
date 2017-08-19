var express = require("express");
var router = express.Router();
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

var User = require("../model/user");
var Bike = require("../model/bike");
var Location = require("../model/location");

// authentication functions
function ensureAuthenticated(req, res, next)
{
    if (req.isAuthenticated())
    {
        next();
    }
    else
    {
        req.flash("error_msg", "Must be logged in to continue");
        res.redirect("/login");
    }
}

function ensureNoBike(req, res, next)
{
    User.findById(req.user._id, function(err, user)
    {
        if (!user.hasBike)
        {
            next();
            return;
        }

        req.flash("error_msg", "Please return your bike before continuing");
        res.redirect("/info");
    });
}

function ensureHasBike(req, res, next)
{
    User.findById(req.user._id, function(err, user)
    {
        if (user.hasBike)
        {
            next();
            return;
        }

        req.flash("error_msg", "No bike borrowed");
        res.redirect("/");
    });
}

// bikes
router.get("/", ensureAuthenticated, ensureNoBike, function(req, res)
{
    Bike.find({"rider": {$eq: ""}}).select("-combination").sort({"location": 1, "name": 1}).exec(function(err, bikes)
    {
        res.render("bikes", {title: "Available Bikes", bikes: bikes});
    });
});

// register
router.get("/register", function(req, res)
{
    res.render("register", {title: "Register"});
});

router.post("/register", function(req, res)
{
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    // validation
    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("email", "Email is already in use").emailInUse(email);
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("username", "Username is already in use").usernameInUse(username);
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("password2", "Passwords do not match").equals(req.body.password);

    req.getValidationResult().then(function(result)
    {
        if (!result.isEmpty())
        {
            res.render("register", {title: "Register", errors: result.array()});
        }
        else
        {
            var newUser = new User(
            {
                name: name,
                email: email,
                username: username,
                password: password,
                bike: "",
                hasBike: false
            });

            User.createUser(newUser, function(err, user)
            {
                if (err) throw err;
                console.log(user);
            });

            req.flash("success_msg", "Successfully registered! Please login to continue");
            res.redirect("/login");
        }
    });
});

// login
router.get("/login", function(req, res)
{
    res.render("login", {title: "Login"});
});

passport.use(new LocalStrategy(
    function(username, password, done) 
    {
        User.getUserByUsername(username, function(err, user)
        {
            if (err) throw err;
            if (!user)
            {
                return done(null, false, {message: "Invalid username"});
            }

            User.comparePassword(password, user.password, function(err, isMatch)
            {
                if (err) throw err;
                if (isMatch)
                {
                    return done(null, user);
                }
                else
                {
                    return done(null, false, {message: "Invalid password"});
                }
            })
        });
    }));

passport.serializeUser(function(user, done)
{
    done(null, user.id);
});

passport.deserializeUser(function(id, done)
{
    User.getUserById(id, function(err, user)
    {
         done(err, user);
    });
});

router.post("/login",
    passport.authenticate("local", {successRedirect: "/", failureRedirect: "/login", failureFlash: true}),
    function(req, res) 
    {
        res.redirect("/");
    });

// logout
router.get("/logout", ensureAuthenticated, function(req, res)
{
    req.logout();
    req.flash("success_msg", "Successfully logged out");

    res.redirect("/login");
});

// borrow
router.get("/borrow", ensureAuthenticated, ensureNoBike, function(req, res)
{
    var bikeId = req.query.bike_id;

    Bike.find({rider: {$eq: ""}}).select("-combination").sort({"location": 1, "name": 1}).exec(function(err, bikes)
    {
        var sortedBikes = [];
        var temp = "";
        var numLocs = -1;
        var numInLoc = 0;
        for (var bike of bikes)
        {
            if (bike._id == bikeId)
                bike.selected = true;
            if (bike.location != temp)
            {
                temp = bike.location;
                numLocs++;
                numInLoc = 0;
                sortedBikes[numLocs] = [];
            }

            sortedBikes[numLocs][numInLoc] = bike;
            numInLoc++;
        }

        res.render("borrow", {"title": "Borrow A Bike", "bikes": sortedBikes});
    });
});

router.post("/borrow", function(req, res)
{
    var bikeId = req.body.bikeSelect;
    var userId = req.user._id;

    if (!bikeId)
    {
        req.flash("error_msg", "Select a bike to borrow")
        return res.redirect("/borrow");
    }

    User.findByIdAndUpdate(userId, {$set: {bike: bikeId, hasBike: true}}, {new: true}, function(err, newUser)
    {
        if (err) throw err;
        req.login(newUser, function(err)
            {
                if (err) throw err;
            });

        Bike.findByIdAndUpdate(bikeId, {$set: {rider: userId}}, {new: true}, function(err, newBike)
        {
            if (err) throw err;
            console.log("User [" + newUser.name + "] borrowed Bike [" + newBike.name + "] from Location [" + newBike.location + "] on " + new Date());
        });
    });

    req.flash("success_msg", "Successfully borrowed a bike")
    res.redirect("/info");
});

// return
router.get("/return", ensureAuthenticated, ensureHasBike, function(req, res)
{
    Bike.findById(req.user.bike).exec(function(err, bike)
        {
            Location.find().sort({name: 1}).exec(function(err, locations)
            {
                res.render("return", {title: "Return A Bike", bikeName: bike.name, "locations": locations});
            })
        });
});

router.post("/return", function(req, res)
{
    var location = req.body.locationSelect;
    var userId = req.user._id;
    var bikeId = req.user.bike;

    if (!location)
    {
        req.flash("error_msg", "Select a return location");
        return res.redirect("/return");
    }

    User.findByIdAndUpdate(userId, {$set: {bike: "", hasBike: false}}, {new: true}, function(err, newUser)
    {
        if (err) throw err;
        req.login(newUser, function(err)
            {
                if (err) throw err;
            });

        Bike.findByIdAndUpdate(bikeId, {$set: {rider: "", "location": location}}, {new: true}, function(err, newBike)
        {
            if (err) throw err;
            console.log("User [" + newUser.name + "] returned Bike [" + newBike.name + "] to Location [" + location + "] on " + new Date());
        });
    });

    req.flash("success_msg", "Successfully returned your bike. Thank you!")
    res.redirect("/");
});

// info
router.get("/info", ensureAuthenticated, ensureHasBike, function(req, res)
{
    //only point at which entire bike (including combination) is sent over server
    Bike.findById(req.user.bike).exec(function(err, bike)
    {
        res.render("info", {title: "Bike Info", "bike": bike});
    });
});

router.post("/info", function(req, res)
{
    res.redirect("/return");
})

module.exports = router;