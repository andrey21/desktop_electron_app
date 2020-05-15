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

var activeUsers = [];

app.get('/', (req, res) => {
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../chat-application', 'index.html'));
});

io.on('connection', (socket) => { 

  socket.on('report', (message) => {
    io.to(message.receiver).emit('report', message);
  });

  socket.on('notice', (sender, receiver) => {
    io.to(receiver.id).emit('notice', sender, receiver);
  });

  socket.on('newUser', (user) => {
    var newUser = {id: socket.id, name: user};
    activeUsers.push(newUser);
    io.to(socket.id).emit('newUser', newUser);
    io.emit('activeUsers', activeUsers);
  });

  socket.on('disconnect', () => {
    activeUsers.forEach((user, index) => {
      if(user.id === socket.id) {
        activeUsers.splice(index, 1);
        io.emit('logOutUser', socket.id);
        io.emit('activeUsers', activeUsers);
      }
    });
  });

});
