var mongoose = require("mongoose");

// bike schema
var BikeSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    combination: {
        type: String
    },
    location: {
        type: String
    },
    rider: {
        type: String
    }
});

var Bike = module.exports = mongoose.model("Bike", BikeSchema);