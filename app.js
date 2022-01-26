const express = require('express');
var path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//app.get('/', (req, res) => {
//  res.sendFile(__dirname + '/index.html');
//});

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', (socket) => {
  console.log('a user connected');
  handlePlayerConnect(socket);
  socket.emit('starting_info', GAME_STATE);
  socket.on('board_action', function(client_object) {
    updateGameState(client_object.x, client_object.y);
    io.sockets.emit("game_state_update", GAME_STATE);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

const PLAYER_IDS = {};

const board_tiles = 5;
const board_size = board_tiles * 2 + 1;
const board = [];
for (var i = 0; i < board_size; i++) {
  const row = [];
  for (var j = 0; j < board_size; j++) {
    row.push({ "index": 0, "player": -1, "type": getTileType(i, j)});
  }
  board.push(row);
}

const GAME_STATE = { "board": board, "resources": [], "hand": [] };

function updateGameState(x, y) {
  let tile = GAME_STATE.board[x][y];
  GAME_STATE.board[x][y].index = (tile.index + 1) % getTypeAmount(tile.type);
  console.log(GAME_STATE);
  
}

function getTileType(x, y) {
  if (x%2 == 0 && y%2 == 0) {
    return "corner";
  }
  if (x%2 == 1 && y%2 == 0) {
    return "cell";
  }
  return "edge";
}

function getTypeAmount(type) {
  if (type == "corner") {
    return 8;
  } else if (type == "face") {
    return 6;
  } else if (type == "edge") {
    return 3;
  }
}

function getTileName(type, index) {
  const cornerNames = ["none", "chickencoop", "library", "loom", "outhouse", "slaughterhouse", "tractor", "well"];
  const edgeNames = ["none", "fence", "canal"];
  const cellNames = ["none", "sheep", "hen", "squash", "bean", "corn"];
  if (type == "corner") {
    return cornerNames[index];
  } else if (type == "edge") {
    return edgeNames[index];
  } else if (type == "cell") {
    return cellNames[index];
  } else {
    return null;
  }
}

function handlePlayerConnect(socket) {
  console.log('fucku');
}
