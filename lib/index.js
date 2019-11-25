var db = require('./db')


exports.main = (req, res) => {
  if (!req.session.isloggedin) {
    res.render('main', {
      firstname: undefined
    });
  }
  else {
    res.render('main', {
      firstname : req.session.accountInfo.firstname,
      friendList : req.session.friendList
    })
  }
}

exports.sign_in = (req, res) => {
  //var accountInfo = req.session.accountInfo;
  // if(accountInfo === undefined)
  if (!req.session.isloggedin) {
    res.render('sign_in');
  }
  else if (req.session.isloggedin) {
    res.send(
      `
        <script>
          alert("You already logged in here.");
          window.history.back();
        </script>
      `
    );
  }
}

exports.sign_in_process = (req, res) => {
  var post = req.body;
  // Check empty input from view
  if (!post.email && !post.password) {
    console.log("empty id and pw");
  } else if (!post.email || !post.password) {
    console.log('empty id or pw')
  } else {
    var sql = `SELECT * FROM account WHERE email = ?`;
    db.query(sql, [post.email], (err, stored) => {
      if (err) throw err;

      if (Array.isArray(stored) && stored.length === 0) {
        console.log('no data');
        res.send(`
                <script type="text/javascript">
                    alert("Server can not find the id");
                    window.history.back();
                </script>`);
      }
      else if (post.password !== stored[0].password) {
        console.log('incorrect password')
      }
      else if (post.password === stored[0].password) 
      {
        var accountInfo = {
          id: stored[0].id,
          nickname: stored[0].nickname,
          email: stored[0].email,
          lastname: stored[0].lastname,
          firstname: stored[0].firstname,
          birth: stored[0].birth
        }
        var securityInfo = {
          passwd: post.passwd
        }

        req.session.isloggedin = true;
        req.session.accountInfo = accountInfo;
        req.session.securityInfo = securityInfo;

        // TODO: Load friend list... (2019/11/19 1:53 AM)
        LoadFriendList(req.session, (err, data) => {
          if (err) 
          {
            console.log(err);
            throw err;
          }
          if(Array.isArray(data) && data.length === 0)
          {
            req.session.friendList = undefined;
            req.session.save(() => {
              res.redirect('/');
            })
          }
          else if (data != null) 
          {
            GetFriendInfo(null, data, (err, data) => {
              req.session.friendList = data;
              req.session.save(() => {
                res.redirect('/');
              })
            })
          }
        })
      }
    })
  }
}

exports.sign_up_process = (req, res) => {
  var post = req.body;
  var flag_nickname = false;
  var flag_email = false;
  console.log("post:", post);
  db.query(`SELECT * FROM account`, (err, stored) => {
    if (err) {
      console.log(err);
      throw err;
    }
    else {
      for (i = 0; i < stored.length; i++) {
        if (stored[i].nickname === post.nickname) flag_nickname = true;
        if (stored[i].email === post.email) flag_email = true;
      }
      if (flag_nickname)
        res.send(`
          <script>
            alert("Nickname ${post.nickname} is already exist");
            window.history.back();
          </script>
        `);
      else if (flag_email)
        res.send(`
          <script>
            alert("User email ${post.email} is already exist");
            window.history.back();
          </script>
          `)
      else
        db.query(`INSERT INTO account( email, password, birth, nickname, firstname, lastname) VALUES(?,?,?,?,?,?)`,
          [post.email, post.password, post.birth, post.nickname, post.firstname, post.lastname],
          (err, stored) => {
            if (err) {
              console.log(err);
              throw err;
            }
            console.log("stored:", stored);

            db.query(`SELECT id FROM account WHERE email=?`, [post.email], (err, result) => {

              var accountInfo = {
                id: result[0].id,
                email: post.email,
                nickname: post.nickname,
                lastname: post.lastname,
                firstname: post.firstname,
                birth: post.birth
              }
              console.log(accountInfo);
              var securityInfo = {
                passwd: post.password
              }

              req.session.accountInfo = accountInfo;
              req.session.securityInfo = securityInfo;

              req.session.save(() => {
                res.redirect('/');
              });

            });

          });
    }
  });
}

exports.sign_out = (req, res) => {
  var accountInfo = req.session.accountInfo;

  if (accountInfo === undefined) {
    res.send(`
        <script>
          alert("Sign in first.");
          location.href="/";
        </script>
      `);
  } else {
    var firstname = accountInfo.firstname;
    req.session.destroy((err) => {
      if (err) console.error('err: ', err);
      res.send(`
            <script>
                alert("Bye ${firstname}.");
                location.href="/";
            </script>
        `);
    });
  }
}

exports.info = (req, res) => {
  var accountInfo = req.session.accountInfo;
  if (accountInfo === undefined) {
    res.send(`
        <script>
            alert("Sign in first.");
            window.history.back();
        </script>
        `);
  }
  else {
    res.render('info', { accountInfo });
  }
}

exports.info_update = (req, res) => {
  var post = req.body;
  var flag = false;
  db.query(`SELECT email FROM account WHERE id != ?`, [post.id], (err, stored) => {
    console.log(!post.email);
    if (err) {
      console.log(err);
      throw err;
    }
    else {
      for (i = 0; i < stored.length; i++)
        if (stored[i].email === post.email) flag = true;

      if (flag)
        res.send(`
          <script>
            alert("Email ${post.email} is already exist");
            window.history.back();
          </script>
          `);
      else {
        db.query(`UPDATE account SET email=?, firstname=?, lastname=?, modified_date=NOW() WHERE id=?`,
          [post.email, post.firstname, post.lastname, post.id]), (err, stored) => {
            if (err) {
              console.log(err);
              throw err;
            }
            console.log(stored);

            res.send(`
                <script>
                  alert("Success");
                  location.href="/info";
                </script>
              `);
          }
      }
    }
  });
}

exports.delete_account = (req, res) => {
  var accountInfo = req.session.accountInfo;
  var securityInfo = req.session.securityInfo;
  if (accountInfo === undefined || securityInfo === undefined) {
    res.send(`
        <script>
            alert("Sign in first.");
            location.href="/";
        </script>
        `);
  }
  else {
    res.render('delete_account', { accountInfo, securityInfo });
  }
}

exports.delete_process = (req, res) => {
  var accountInfo = req.session.accountInfo;
  var securityInfo = req.session.securityInfo;
  if (accountInfo === undefined || securityInfo === undefined) {
    res.send(`
        <script>
            alert("Sign in first.");
            location.href="/";
        </script>
        `);
  }
  else if (req.body.passwd !== accountInfo.passwd) {
    res.send(`
        <script>
            alert("Password incorrect.");
            window.history.back();
        </script>
        `);
  }
  else {
    db.query(`DELETE FROM account WHERE id=?`, [accountInfo.id], (err, stored) => {
      if (err) throw err;
      res.send(`
            <script>
              alert("Delete completed.");
              location.href="/";
            </script>
          `);
    });
  }
}



function LoadFriendList(session, callback) {
  if (session.isloggedin) {
    var _list = [];
    var _id = session.accountInfo.id;
    db.query(`SELECT * FROM friend_request WHERE (sender=? OR receiver=?) AND state = 'accepted'`,
      [_id, _id], (err, result) => {
        if (err) callback(err, null);
        else {
          if (Array.isArray(result) && result.length === 0) {
            return callback(null, _list);
          }
          else {
            for (var i = 0; i < result.length; i++) {
              if (result[i].sender == _id) {
                _list[i] = result[i].receiver;
              }
              else if (result[i].receiver == _id) {
                _list[i] = result[i].sender;
              }
            }
            console.log('loadfrndlist()', _list);
            // return callback(null, _list);
            return callback(null, _list, callback);
          }
        }
      })
  }
}

function GetFriendInfo(session, list, callback) {
  if (Array.isArray(list) && list.length !== 0) {
    var _list = list;
    var sql = `SELECT id, firstname, lastname, email, nickname, birth FROM account WHERE id=${_list[0]}`
    for (var i = 1; i < _list.length; i++) {
      sql += ` OR id=${_list[i]} `;
    }
    console.log(sql);
    db.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        callback(err, result);
      }
      else if (Array.isArray(result) && result.length === 0) {
        // return result;
        console.log('bcdbcdbcd');
        return callback(null, result);
      }
      else {
        console.log("***1", result);
        // return result;
        return callback(null, result);
      }
    })
  }
}