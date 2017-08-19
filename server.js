const PORT = 8080;

// requires
var express = require("express");
var hbs = require("express-handlebars");
var session = require("express-session");
var expressValidator = require("express-validator");
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var http = require("http");
//var https = require("https");
var path = require("path");
var fs = require("fs");
var User = require(path.join(__dirname, "model", "user"));

//create database
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/CesspoolBikes", {useMongoClient: true});
var db = mongoose.connection;

// create app
var app = express();

// express session
app.use(session({
    secret: "mr poopy butthole",
    resave: "true",
    saveUninitialized: "false"
}));

// connect flash
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());

// global flash message variables
app.use(function(req, res, next)
{
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    res.locals.user = req.user;
    next();
});

// view engine
app.engine("handlebars", hbs({defaultLayout: "layout"}));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "handlebars");

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// express validator
app.use(expressValidator({
    errorFormatter: function(param, msg, value)
    {
        var namespace = param.split('.')
        var root = namespace.shift()
        var formParam = root;
    
        while(namespace.length) 
        {
            formParam += '[' + namespace.shift() + ']';
        }

        return {
            param : formParam,
            msg : msg,
            value : value
        };
    },
    customValidators:
    {
        usernameInUse: function(username) {
            return new Promise(function(resolve, reject)
            {
                User.find({"username": username}).limit(1).exec(function(err, docs)
                {
                    if (docs.length)
                        return reject(docs);
                    resolve(err);
                });
            });
        },
        emailInUse: function(email) {
            return new Promise(function(resolve, reject)
            {
                User.find({"email": email}).limit(1).exec(function(err, docs)
                {
                    if (docs.length)
                        return reject(docs);
                    resolve(err);
                });
            });
        }
    }
}));

// routes
var routes = require(path.join(__dirname, "routes", "index"));
app.use("/", routes);

// set directory
app.use(express.static(path.join(__dirname, "public")));

// server start

var server = http.createServer(app);

// var server = https.createServer({
// 	cert: fs.readFileSync(path.join(__dirname, "/ssl/cert.pem")),
// 	key: fs.readFileSync(path.join(__dirname, "/ssl/key.pem"))
// },app);

server.listen(PORT, "172.31.46.229", function()
{
	console.log("Server started on port: " + PORT);
});