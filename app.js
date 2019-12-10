const express = require('express');
var app = require('express')();
var session = require('express-session');
var path = require('path');
var bodyparser = require('body-parser');

var server = require('http').createServer(app);
var io = require('socket.io')(server);
module.exports = io;
var port = process.env.port || 3000;


// view engine
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname + '/views'));

app.use(express.json());
app.use(bodyparser.urlencoded({
    extended: false
}))

app.use(express.static(path.join(__dirname, 'views'), {
    extensions: ['html', 'htm']
}))

// app.use(express.static(path.join(__dirname, 'views'), {
//     extensions: ['html', 'htm']
// }))
//app.use('/public', express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
	secret:'@#cat#@',
	saveUninitialized:false,
    resave:false,
    isLoggedin:false
	//store:new FileStore()
}));


var indexRouter = require('./routes/index');
var friendRouter = require('./routes/friend');
var chatRouter = require('./routes/chat');



app.use('/', indexRouter);
app.use('/friend', friendRouter);
app.use('/chat', chatRouter);



app.use( (req, res, next) => {
	res.status(404).send('Can not find (404)');
});

server.listen(port, () => {
    console.log(`server listening on port *`, port);
});

