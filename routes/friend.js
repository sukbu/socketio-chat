var express = require('express')
var router = express.Router()

var friend = require('../lib/friend')

router.get('/', (req, res) => {
    if(req.session.accountInfo)
    {
        friend.main(req, res);
    } 
    else 
    {
        res.send(`
            <script>
                alert("Sign in first.");
                location.href="/";
            </script>
        `);
    }
})

router.post('/add', (req, res, next) => {
    friend.add_friend(req, res);
})

router.post('/accept', (req, res, next) => {
    friend.accept(req, res);
})

module.exports = router;