var express = require('express');
var router = express.Router();

var Lathe = require('../public/js/db.js').Lathe;
var Material = require('../public/js/db.js').Material;

/* GET home page. */
router.get('/', function (req, res, next) {
    Lathe.find({}, function (err, lathes) {
        var materials = Material.allMats;
        //Material.find().lean().exec({}, function (err, materials) {
            res.render('index', {
                materials: materials,
                lathe: lathes,
                title: 'BrowserCad Home',
                partials: {
                    codeOutput: 'codeOutput',
                    operationModal: 'operationModal',
                    geometryModal: 'geometryModal',
                    latheInfo: 'latheInfo'
                }
            });
        //});
    })
});

module.exports = router;
