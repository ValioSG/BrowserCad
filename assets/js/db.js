var mongo = require('mongodb');
var mongoose = require('mongoose');

mongoose.connect('localhost:27017/BrowserCad');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('connected to db');
});

var latheSchema = mongoose.Schema({
    model: String,
    spindle: {
        nose: String,
        taper: String,
        maxTorque: Number
    },
    maxFeedRate: Number,
    mainDrive: Number,
    speedRanges: {
        first: String,
        second: String
    },
    maxWorkDiameter: Number,
    maxWorkLength: Number
});

var materialSchema = mongoose.Schema({
    brass: {
        hexColor: String
    },
    c45: {
        hexColor: String
    },
    stainless: {
        hexColor: String
    }
});

var toolSchema = mongoose.Schema();

exports.Lathe = mongoose.model('Lathe', latheSchema);
exports.Material = mongoose.model('Material', materialSchema);
exports.Tool = mongoose.model('Tool', toolSchema);