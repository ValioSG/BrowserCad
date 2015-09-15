var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'BrowserCad Home' ,
      partials: {
          codeOutput: 'codeOutput',
          operationModal: 'operationModal',
          geometryModal: 'geometryModal'
      }
  });
});

module.exports = router;