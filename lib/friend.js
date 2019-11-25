var db = require('./db')

var UserData = {
    accountInfo: undefined,
    sent_requests: undefined,
    recv_requests: undefined
}

exports.main = (req, res) => {
    UserData.accountInfo = req.session.accountInfo;
    db.query(`SELECT acc.id, acc.nickname, acc.email, req.receiver FROM friend_request req, account acc WHERE req.sender = ? AND req.receiver = acc.id AND req.state IS NULL`,
        [UserData.accountInfo.id],
        (err, result) => {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else {
                console.log("2");
                UserData.sent_requests = result;
            }
        });
    db.query(`SELECT acc.id, acc.nickname, acc.email, req.sender FROM friend_request req, account acc WHERE req.receiver = ? AND req.sender = acc.id AND req.state IS NULL`, 
        [UserData.accountInfo.id],
        (err, result) => {
            if (err) {
                console.log(err);
                res.send(err);
            }
            else {
                console.log("3");
                console.log("/sentreqs/\n",UserData.sent_requests);
                UserData.recv_requests = result;
                console.log("/recvrecvreqs/\n",UserData.recv_requests);
                res.render('friend',UserData);
            }
        });
    console.log("1", UserData);
}



exports.add_friend = (req, res) => {
    var sender = req.session.accountInfo.email;
    var receiver = req.body.friend_email;
    // console.log('friend_email: ' + receiver);
    db.query(`SELECT id, nickname, email FROM account WHERE email = ?`, [receiver],
        (err, result) => {
            // console.log("result: " + result);
            // console.log("result[0]: " + result[0]);
            if (err) {
                throw err;
            }
            else if (Array.isArray(result) && result.length === 0)
                res.send(
                    `
                <script>
                alert("There is no user like ${receiver}.");
                window.history.back();
                </script>
                `);
            else {
                var send_id = req.session.accountInfo.id;
                var recv_id = result[0].id;
                console.log("send_id: " + send_id);
                console.log("recv_id: " + recv_id);
                db.query(`SELECT * FROM friend_request WHERE sender=? AND receiver=? OR sender=? AND receiver=?`, [send_id, recv_id, recv_id, send_id],
                    (err, result2) => {
                        if (err) throw err;
                        else {
                            if (Array.isArray(result2) && result2.length === 0) {
                                db.query(`INSERT INTO friend_request(sender, receiver) VALUES(?, ?)`, [send_id, recv_id],
                                    (err, result3) => {
                                        if (err) throw err;
                                    });
                                res.send(
                                    `
                                    <script>
                                        alert("We have sent your request to ${receiver}");
                                        window.history.back();
                                    </script>
                                `);
                            }
                            else if(result2[0].state == 'accepted')
                            {
                                res.send(
                                    `
                                    <script>
                                        alert("You already have connection with ${result[0].nickname}");
                                        location.href="/friend";
                                    </script>
                                `);
                            }
                            else {
                                res.send(
                                    `
                                    <script>
                                        alert("You already sent the request to ${receiver}.");
                                        window.history.back();
                                    </script>
                                `);
                            }
                        }
                    });
            }
        });
}

exports.accept = (req, res) => {
    console.log(req.body.id);
    console.log(req.session.accountInfo.id);
    
    db.query(`UPDATE friend_request SET accepted_date = NOW(), state = ? WHERE sender=?
     AND receiver=?`,
    ['accepted', req.body.id, req.session.accountInfo.id],
    (err, results) => {
        if(err) {
            console.log(err);
            res.send(err);
        }
        else {
            res.redirect('/friend');
        }
    })
}