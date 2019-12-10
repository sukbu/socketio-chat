var moment = require('moment');
var fs = require('fs');

var io = require('../app');
var db = require('./db');

exports.main = (req, res) => {
    res.render('chat', {
        accountInfo : req.session.accountInfo,
        targetid : req.body.friend_id
    });
}

// var userList = { '5':'ashdjkqhwkej' };

// var roomList = { '5to4' : { 
//     sender:'5',
//     receiver:'4',
//     created:1829038
// }};

var userList = {};
var roomList = {};

var td = new String;

io.on('connection', (socket) => {
    
    socket.on('join', (data) => {
        console.log(Object.keys(data));
        console.log('0 client joined: ',Object.values(data));
        // TODO: Load chatdata


        socket.name = data.name;

        userList[data.userid] = socket.id;

        var roomcode = data.userid + 'to' + data.targetid;
        var reverseCode = data.targetid + 'to' + data.userid;
        var currentRoomCode;
        if(!(data.targetid in userList))
        {
            currentRoomCode = socket.room = roomcode;
            LoadChatdata(data, currentRoomCode);
            // 유저 목록에 없다 = 오프라인 = 해당 방이 없다(이 가정이 맞을지..)
            console.log('1 target is not logged in');
            roomList[roomcode] = {
                sender: data.userid,
                receiver: data.targetid,
                created: Date.now()
            }

            socket.join(currentRoomCode);
            io.to(currentRoomCode).emit('join',{serv_msg: data.name+' arrived.', roomcode:currentRoomCode});

        }
        else if(data.targetid in userList && !(reverseCode in roomList))
        {
            currentRoomCode = socket.room = roomcode;
            LoadChatdata(data, currentRoomCode);
            console.log('2 target exists but have not yet create any room to user');
            // 유저목록에 있지만, 해당 방이 없다.
            roomList[roomcode] = {
                sender: data.userid,
                receiver: data.targetid,
                created: Date.now()
            }

            socket.join(currentRoomCode);
            io.to(currentRoomCode).emit('join', {serv_msg: data.name+' arrived.', roomcode:currentRoomCode});
        }
        else if(data.targetid in userList && reverseCode in roomList) 
        {           
            currentRoomCode = socket.room = reverseCode;
            LoadChatdata(data, currentRoomCode);
            // 유저목록에 있다, 나에게 보내는 방이 있으므로 그 방에 전송
            console.log('3 found target %d and room '+reverseCode,data.targetid);

            socket.join(currentRoomCode);
            io.to(currentRoomCode).emit('join', {serv_msg: data.name+' arrived.', roomcode:currentRoomCode});
        }
        else
        {
            console.log('undefined behaviour');
        }
        
    })




    socket.on('clnt msg', (data) => {

        db.query(`INSERT INTO chatdata( send_id, sender, recv_id, receiver, time, msg ) VALUES(?, (SELECT nickname FROM account WHERE id=?),
            ?, (SELECT nickname FROM account WHERE id=?),
            NOW(), ?)`,[data.userid, data.userid, data.targetid, data.targetid, data.msg],(err, results) => {
            if(err){
                console.log(err);
            } 
            else {
                console.log(results);
            }
        })
        console.log('clnt msg: '+data.name+", "+data.userid+", "+data.room);

        var name = socket.name = data.name;
        var room = socket.room = data.room;
        console.log(data);
        console.log('name:%s, room:%s',name,room);
        /*
        ==== CHAT EXPORT ====
        var textdata = new String;
        textdata = `[${data.name}][${moment(Date.now()).format("YYYY-MM-DD hh:mm:ss")}] ${data.msg}`;
        td+=(textdata+'\n');
        // console.log(textdata);

        fs.writeFile('test.txt', td, 'utf8',(err, data) => {
            if(err){
                console.log(err);
            } else {
                console.log(data);
            }
            // console.log(data);
        })
        */
        io.to(room).emit('serv msg', data);
    })
    
    socket.on('disconnect', () => {
        var disUser = findUser(userList, socket);
        console.log('user disconnected: '+socket.name+", "+socket.room);
        console.log('socket:',socket);
        console.log('userlist:',userList);
        console.log('roomList:',roomList);
        io.to(socket.room).emit('disconnect', {
            serv_msg:socket.name+" left."
        });
        //socket.removeAllListeners();
        delete userList[disUser];
    })
    
})


function findUser(userList, socket) {
    return Object.keys(userList).find(id => userList[id] == socket.id);
}

function LoadChatdata(data, currentRoomCode)
{
    db.query(`SELECT * FROM chatdata WHERE (send_id=? AND recv_id=?) OR (send_id=? AND recv_id=?)`,[data.userid, data.targetid, data.targetid, data.userid], (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
            // console.log("**", results);
            // console.log("**", Object.keys(results));
            // console.log("**", Object.values(results));
            console.log(results.length);

            let chatdata = [];

            for(let i=0; i<results.length; i++){
                chatdata.push(
                    {
                        sender : results[i].sender,
                        msg : results[i].msg
                    }
                )
            }
            
            io.to(currentRoomCode).emit('LoadChatdata', chatdata);
        }
    })
}