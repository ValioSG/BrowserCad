var express = require('express');
var router = express.Router();

var Lathe = require('../assets/js/db.js').Lathe;
var Material = require('../assets/js/db.js').Material;
var Tool = require('../assets/js/db.js').Tool;

/* GET home page. */
router.get('/', function (req, res, next) {
    Lathe.find({}, function (err, lathes) {
        //var materials = Material.allMats;
        //Material.find().lean().exec({}, function (err, materials) {
            res.render('index', {
                //materials: materials,
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

router.route('/materials')
    .get(function(req, res) {
        Material.find(function(err, materials) {
            if (err)
                res.send(err);

            res.json(materials);
        });
    });

router.route('/tools')
    .get(function(req, res) {
        Tool.find(function(err, tools) {
            if (err)
                res.send(err);

            res.json(tools);
        });
    });

router.route('/receiveCode')
    .post(function(req, res) {
        res.json(JSON.stringify(req.body.machineCode));
    });

module.exports = router;
