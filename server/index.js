const express = require('express');
var cors = require('cors');
const http = require('http');

const {addUser, removeUser, getUser, getUSersInRoom} = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(router); // middleware



const io = require('socket.io')(server,{
    cors: {
        origins:["*"],
        
        handlePreflightRequest: (req, res) => {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST",
                "Access-Control-Allow-Headers": "my-custom-header",
                "Access-Control-Allow-Credentials": false
            });
            res.end();
        }
    }
});


io.on('connection', (socket) => {
    console.log(`New user connected with id: ${socket.id}`);
    socket.on('join', ({name, room }, callback) => {
        const { err,user } = addUser({id: socket.id, name, room});

        if(err) return callback(err);

        socket.join(user.room);

        socket.emit('message', {user: 'admin', text:`${user.name}, welcome to room ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', { user:'admin', text:`${user.name}, has joined!`});

        io.to(user.room).emit('roomData', { room:user.room, users:getUSersInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users:getUSersInRoom(user.room)});

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', {user: 'admin', text:`${user.name} has left.`})
        }
        console.log('User Disconnected!!');
    });
});

server.listen(PORT, () => console.log('Server has started on port %s',PORT));