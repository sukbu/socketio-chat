// var io = require('../app');
var express = require('express')
var router = express.Router()

var chat = require('../lib/chat');


router.post('/', (req, res) => {
    chat.main(req, res);
})

module.exports = router;