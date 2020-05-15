const {remote} = require('electron')
const prompt = require('electron-prompt');

let WIN      = remote.getCurrentWindow();
var socket = io.connect('http://localhost:3010');
var allReports = [];
var chatNotificationCount = [];
var myUser = {};
var myFriend = {};

$(document).ready(function(){
  performLogin();
});

function performLogin() {
  prompt({
      title: 'Please enter your name:',
      label: 'User name',
      value: '',
      inputAttrs: {
          type: 'input'
      },
      type: 'input'
  }, WIN)
  .then((r) => {
      if(r === null) {
          console.log('user cancelled');
      } else {
          console.log('result', r);
          var person = r;
    if (/([^\s])/.test(person) && person != null && person != "") {
      //$('#user').val(person);
      socket.emit('newUser', person);
      document.title = person;
    } else {
      location.reload();
    }
      }
  })
  .catch(console.error);
}

function submitfunction() {
  var message = {};
  text = $('#m').val();
  
  if(text != '') {
    message.text = text;
    message.sender = myUser.id;
    message.receiver = myFriend.id;

    $('#messages').append('<li class="chatMessageRight">' + message.text + '</li>');
    
    if(allReports[myFriend.id] != undefined) {
      allReports[myFriend.id].push(message);
    } else {
      allReports[myFriend.id] = new Array(message);
    }
    socket.emit('report', message);
  }

  $('#m').val('').focus();
  return false;
}

function notice() { 
  socket.emit('notice', myUser, myFriend);
}

function chatingBox(messages) {
  $('#messages').html('');
  messages.forEach(function(message){
    var cssClass = (message.sender == myUser.id) ? 'chatMessageRight' : 'chatMessageLeft';
    $('#messages').append('<li class="' + cssClass + '">' + message.text + '</li>');
  });
}

function appendChatMessage(message) {
  if(message.receiver == myUser.id && message.sender == myFriend.id) {
    reportAudio();
    var cssClass = (message.sender == myUser.id) ? 'chatMessageRight' : 'chatMessageLeft';
    $('#messages').append('<li class="' + cssClass + '">' + message.text + '</li>');
  } else {
    noticeAudio();
    updatingNotificationCount(message.sender);
  }

  if(allReports[message.sender] != undefined) {
    allReports[message.sender].push(message);
  } else {
    allReports[message.sender] = new Array(message);
  }
}

function reportAudio() {
  (new Audio('https://notificationsounds.com/soundfiles/8b16ebc056e613024c057be590b542eb/file-sounds-1113-unconvinced.mp3')).play();
}

function noticeAudio() {
  (new Audio('https://notificationsounds.com/soundfiles/dd458505749b2941217ddd59394240e8/file-sounds-1111-to-the-point.mp3')).play();
}

function updatingNotificationCount(userId) {
  var count = (chatNotificationCount[userId] == undefined) ? 1 : chatNotificationCount[userId] + 1;
  chatNotificationCount[userId] = count;
  $('#' + userId + ' label.chatNotificationCount').html(count);
  $('#' + userId + ' label.chatNotificationCount').show();
}

function clearNotification(userId) {
  chatNotificationCount[userId] = 0;
  $('#' + userId + ' label.chatNotificationCount').hide();
} 

function selectUerChatBox(element, userId, userName) {
  myFriend.id = userId;
  myFriend.name = userName;

  $('#form').show();
  $('#messages').show();
  $('#activeUsers li').removeClass('active');
  $(element).addClass('active');
  $('#notice').text('');
  $('#m').val('').focus();

  clearNotification(userId);

  if(allReports[userId] != undefined) {
    chatingBox(allReports[userId]);
  } else {
    $('#messages').html('');
  }
}

socket.on('newUser', function(newUser){
  myUser = newUser;
  $('#myName').html(myUser.name);
});

socket.on('notice', function(sender, recipient){
  if(myFriend.id == sender.id) {
    $('#notice').text(sender.name + ' is typing ...');
  }
  setTimeout(function(){ $('#notice').text(''); }, 5000);
});

socket.on('activeUsers', function(activeUsers){
  var usersList = '';

  if(activeUsers.length == 2) {
    activeUsers.forEach(function(user){
      if(myUser.id != user.id){
        myFriend.id = user.id;
        myFriend.name = user.name;
        $('#form').show();
        $('#messages').show();
      }
    });
  }
  
  activeUsers.forEach(function(user){
    if(user.id != myUser.id) {
      var activeClass = (user.id == myFriend.id) ? 'active' : '';
      usersList += '<li id="' + user.id + '" class="' + activeClass + '" onclick="selectUerChatBox(this, \'' + user.id + '\', \'' + user.name + '\')"><a href="javascript:void(0)">' + user.name + '</a><label class="chatNotificationCount"></label></li>';
    }
  });
  $('#activeUsers').html(usersList);
});

socket.on('report', function(message){
  appendChatMessage(message);
});

socket.on('logOutUser', function(userId){
  delete allReports[userId];
  $('#form').hide();
  $('#messages').hide();
});
