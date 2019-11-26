var io = require('../app');

exports.main = (req, res) => {
    res.render('chat', {
        accountInfo : req.session.accountInfo,
        targetid : req.body.friend_id
    });
}

var userList = { '5':'ashdjkqhwkej' };

var roomList = { '5to4' : { 
    sender:'5',
    receiver:'4',
    created:1829038
}};


io.on('connection', (socket) => {

    socket.on('join', (data) => {
        console.log(Object.keys(data));
        console.log('0 client joined: ',Object.values(data));
        socket.name = data.name;

        userList[data.userid] = socket.id;

        var roomcode = data.userid + 'to' + data.targetid;
        var reverseCode = data.targetid + 'to' + data.userid;
        var currentRoomCode;
        if(!(data.targetid in userList))
        {
            currentRoomCode = roomcode;
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
            currentRoomCode = roomcode;
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
            currentRoomCode = reverseCode;
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
        console.log('clnt msg: '+data.name+", "+data.userid+", "+data.room);

        var name = socket.name = data.name;
        var room = socket.room = data.room;
        console.log('name:%s, room:%s',name,room);
        
        io.to(room).emit('serv msg', data.name+":"+data.msg+'\n');
    })
    
    // socket.on('forceDisconnect', () => {
    //     socket.disconnect();
    // })

    socket.on('disconnect', () => {
        var disUser = findUser(userList, socket);
        
        console.log('user disconnected: '+socket.name+", "+socket.room);
        io.to(socket.room).emit('serv msg', socket.name+" left.");
        //socket.removeAllListeners();
        delete userList[disUser];
    })
    
})
function findUser(userList, socket) {
    return Object.keys(userList).find(id => userList[id] == socket.id);
}