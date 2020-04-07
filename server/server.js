// var express = require('express');
// // let app = express();
// // var http = require('http').Server(app);
// // var io = require('socket.io')(server);
// // var path = require('path');
// var app = require('express')();
// var http = require('http').createServer(app);
// var io = require('socket.io')(http);
const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

exports.server = {
  run(port) {
    server.listen(port, () => {
      console.log('Server listening at port %d', port);
    });
  },
};

var onlineUsers = [];

// Initialize appication with route / (that means root of the application)
app.get('/', (req, res) => {
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../chat-application', 'index.html'));
});

// Register events on socket connection
io.on('connection', (socket) => { 

  // Listen to chantMessage event sent by client and emit a chatMessage to the client
  socket.on('chatMessage', (message) => {
    io.to(message.receiver).emit('chatMessage', message);
  });

  // Listen to notifyTyping event sent by client and emit a notifyTyping to the client
  socket.on('notifyTyping', (sender, receiver) => {
    io.to(receiver.id).emit('notifyTyping', sender, receiver);
  });

  // Listen to newUser event sent by client and emit a newUser to the client with new list of online users
  socket.on('newUser', (user) => {
    var newUser = {id: socket.id, name: user};
    onlineUsers.push(newUser);
    io.to(socket.id).emit('newUser', newUser);
    io.emit('onlineUsers', onlineUsers);
  });

  // Listen to disconnect event sent by client and emit userIsDisconnected and onlineUsers (with new list of online users) to the client 
  socket.on('disconnect', () => {
    onlineUsers.forEach((user, index) => {
      if(user.id === socket.id) {
        onlineUsers.splice(index, 1);
        io.emit('userIsDisconnected', socket.id);
        io.emit('onlineUsers', onlineUsers);
      }
    });
  });

});

// http.listen(3010, () => {
//     console.log('server is running on port 3000');
// })