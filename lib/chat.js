var io = require('../app');

var userList = {};
// id(DB id), socketid(socket id), room(room code), 

var _targetid;

exports.main = (req, res) => {
    _targetid = req.body.friend_id;
    console.log(_targetid);
    res.render('chat', {
        accountInfo : req.session.accountInfo,
        targetid : _targetid
    });
}


var userList = {};
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        var disUser = findUser(userList, socket);
        console.log('user disconnected: '+socket.name);
        io.to(socket.room).emit('serv msg', socket.name+" left.");
        //socket.removeAllListeners();
        delete userList[disUser];
        //delete io;
    })

    console.log("1:",socket.id);

    socket.on('join', (data) => {
        console.log(Object.keys(data));
        console.log('client joined: ',Object.values(data));
        socket.name = data.name;
        userList[data.userid] = socket.id;
        console.log(userList);
        console.log(socket.name);
        io.to(data.room).emit('join', data.name+" came here."+"\n");
    })

    socket.on('clnt msg', (data) => {
        console.log('clnt msg: '+data.name+", "+data.userid+", "+data.room+":"+data.msg);
        // userList[data.userid] = socket.id;
        // console.log(data.targetid);

        var name = socket.name = data.name;
        var room = socket.room = data.room;
        
        socket.join(room);

        io.to(room).emit('serv msg', data.name+":"+data.msg+'\n');
    })
    
    // socket.on('forceDisconnect', () => {
    //     socket.disconnect();
    // })


    
})
function findUser(userList, socket) {
    return Object.keys(userList).find(id => userList[id] == socket.id);
}