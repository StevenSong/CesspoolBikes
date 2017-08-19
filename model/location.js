var mongoose = require("mongoose");

// location schema
var LocationSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    }
});

var Location = module.exports = mongoose.model("Location", LocationSchema);