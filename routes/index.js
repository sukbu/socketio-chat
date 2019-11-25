var express = require('express')
var router = express.Router()

var index = require('../lib/index')

router.get('/', (req, res) => {
    index.main(req, res);
})

router.get('/sign_in', (req, res) => {
    index.sign_in(req, res);
});

router.post('/sign_in_process', (req, res) => {
    index.sign_in_process(req, res);
});

router.get('/sign_up', (req, res) => {
	res.render('sign_up');
});

router.post('/sign_up_process', (req, res) => {
    index.sign_up_process(req, res);
});

router.get('/sign_out', (req, res, next) => {
    index.sign_out(req, res);
});

router.get('/info', (req, res, next) => {
    index.info(req, res);
})

router.post('/info/update', (req, res, next) => {
    index.info_update(req, res);
})

router.get('/delete_account', (req, res, next) => {
    index.delete_account(req, res);
})

router.post('/delete_process', (req, res, next) => {
    index.delete_process(req, res);
})



module.exports = router