var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

// user schema
var UserSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    bike: {
        type: String
    },
    hasBike: {
        type: Boolean
    },
    admin: {
        type: Boolean
    },
    approved: {
        type: Boolean
    }
});

var User = module.exports = mongoose.model("User", UserSchema);

module.exports.createUser = function(newUser, callback)
{
    bcrypt.genSalt(10, function(err, salt)
    {
        bcrypt.hash(newUser.password, salt, function(err, hash)
        {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserByUsername = function(username, callback)
{
    var query = {username: username};
    User.findOne(query, callback);
}

module.exports.comparePassword = function(password, hash, callback)
{
    bcrypt.compare(password, hash, function(err, isMatch) 
    {
        if (err) throw err;
        callback(null, isMatch);
    });
}

module.exports.getUserById = function(id, callback)
{
    User.findById(id, callback);
}