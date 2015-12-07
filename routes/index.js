var express = require('express');
var router = express.Router();

var Lathe = require('../public/js/db.js').Lathe;

/* GET home page. */
router.get('/', function(req, res, next) {
    Lathe.find({}, function (err, lathes) {
        res.render('index', {
            lathe : lathes,
            title: 'BrowserCad Home' ,
            partials: {
                codeOutput: 'codeOutput',
                operationModal: 'operationModal',
                geometryModal: 'geometryModal',
                latheInfo: 'latheInfo'
            }
        });
    })
});

module.exports = router;
