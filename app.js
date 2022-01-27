// ---------- FARM GAME MAIN SERVER-SIDE JS -----------


// Variables

// Node Related
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
// ------------------------------------------

// Game State Related
const PLAYER_IDS = {};
const board_tiles = 5;
const board_size = board_tiles * 2 + 1;
const board = [];
for (let i = 0; i < board_size; i++) {
  const row = []; 
  for (let j = 0; j < board_size; j++) { 
    row.push({ "index": 0, "player": -1, "type": getTileType(i, j)});
  }
  board.push(row);
}
const tools = {'hammer': 0, 'wrench': 0, 'saw': 0, 'shovel': 0, 'rooster': 0 };
for (let i = 0; i < tools.length; i++) {
  tools.push(0);
}
const GAME_STATE = { "board": board, 
                     "tools": tools,
                     "resources": [], 
                     "hands": [],
                     "character": {} };

const characters = { 'River': { 'canal': 2, 'well': 5, 'bean_not_touching_water': -3, 'animal': -1, 'outhouse': 2 },
                     'Wilder': { 'animal': 3, 'cornertile': -1, 'edgetile': -1, 'outhouse': 8, 'emptycell': 4 },
                     'Mason': { 'cornertile': 4, 'edgetile': 2, 'facetile': -1, 'outhouse': 4, 'wood': 1, 'stone': 1 },
                     'Fleece': { 'sheep': 3, 'corn': -2, 'squash': -2, 'outhouse': -2 },
                     'Helen': { 'chicken': 3, 'corn': -2, 'bean': -2, 'outhouse': -4 },
                     'Autumn': { 'tool': -5, 'rooster': -5, 'fence': -1, 'crop': -3, 'animal': 1 },
                     'Harmony': { 'cropset': 5, 'outhouse': 10, 'animal': -1, 'well': 5, 'slaughterhouse': -5 },
                     'Cash': { 'coin': 1 },
                     'Meadow': { 'pasture_size_2': 3, 'pasture_size_3': 5, 'pasture_size_4': 6, 'pasture_size_5': 12 } }


// Will need to only add character that belongs to user.
let i = 0;
let rand = Math.floor(Math.random() * Object.keys(characters).length);
for (character in characters) {
  if (i == rand) {
    GAME_STATE['character'][character] = characters[character];
    break;
  }
  i++;
}
// ------------------------------------------

// Draft State Related
const PACK_SIZE = 9;
const GAME_ROUNDS = 5;
let numPlayers = 4; // Need to be able to adjust this.

// PACK_STATE = { 'pack1': ['corn', 'corn', 'sheep' ....], 'pack2': [], ... }, 
const PACK_STATE = {};
for (let i = 0; i < (numPlayers * GAME_ROUNDS); i++) {
  PACK_STATE['pack' + i] = [];
}
const gameCards = { 'wood': 25,
                    'stone': 25,
                    'sheep': 25,
                    'hen': 25,
                    'squash': 25,
                    'bean': 25,
                    'corn': 25,
                    'hammer': 1,
                    'wrench': 1,
                    'saw': 1,
                    'shovel': 1,
                    'rooster': 1 };
let gameDeck = [];

clearGameState();
// --------------------------------------

// Serve client-side files
app.use(express.static(path.join(__dirname, 'client')));
// Do we need to run clearBoardState here ?

// Connection listeners / actions
io.on('connection', (socket) => {
  console.log('a user connected');
  console.log('socket.id: ' + socket.id);
  handlePlayerConnect(socket);

  socket.on('get_starting_info', function(client_object) {
    io.sockets.emit('starting_info', GAME_STATE);
  });

  socket.on('board_action', function(client_object) {
    updateBoardTile(client_object.x, client_object.y);
    io.sockets.emit('board_state_update', board);
  });

  socket.on("quantity_action", function(client_object) {
    updateTileQuantity(client_object.x, client_object.y, client_object.increment);
    io.sockets.emit('board_state_update', board);
  });

  socket.on('tool_action', function(client_object) {
    changeTool(client_object.tool);
    io.sockets.emit('tool_state_update', tools);
  });

  socket.on('clear_board', function(client_object) {
    clearGameState();
    io.sockets.emit('game_state_update', GAME_STATE);
  });

  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
// ----------------------------------------------

// Listener Functions
function clearGameState() {
  for (let i = 0; i < board_size; i++) {
    const row = []; 
    for (let j = 0; j < board_size; j++) { 
      board[i][j]['index'] = 0;
      board[i][j]['player'] = -1;
      board[i][j]['type'] = getTileType(i, j);
      board[i][j]['quantity'] = 1;
    }
  }
  for (const tool in GAME_STATE['tools']) {
    GAME_STATE['tools'][tool] = 0;
  }
}

function updateBoardTile(x, y) {
  if (x != null && y != null && (0 <= x <= board_size) && (0 <= y <= board_size)) {
    let tile = GAME_STATE['board'][y][x];
    GAME_STATE['board'][y][x]['index'] = (tile['index'] + 1) % getTypeAmount(tile['type']);
  } else {
    console.log('bad x,y for updateGameState');
  }
}

function getTileType(x, y) {
  if (x%2 == 0 && y%2 == 0) {
    return "corner";
  }
  if (x%2 == 1 && y%2 == 1) {
    return "cell";
  }
  return "edge";
}

function getTypeAmount(type) {
  if (type == "corner") {
    return 8;
  } else if (type == "cell") {
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

function updateTileQuantity(x, y, increment) {
  let tile = GAME_STATE["board"][y][x];
  if (tile["quantity"] + increment > 0) {
    GAME_STATE["board"][y][x]["quantity"] = tile["quantity"] + increment;
  }
}
function changeTool(toolName) {
  GAME_STATE['tools'][toolName] = (GAME_STATE['tools'][toolName] + 1) % 2;
}

function handlePlayerConnect(socket) {
}
// -------------------------------------

// Draft functions
function startDraft() {
  buildDeck();
  buildPacks();
}

function sendPacks() {
// This will be a function of which pack we're on, which player it is, and which pick of the draft it is
// When client picks a card, it emits back the index of the pack that was taken, and backend overwrites with "none"
}

function buildDeck() {
  let newDeck = [];
  for (card in gameCards) {
    for (let i = 0; i < gameCards[card]; i++) {
      newDeck.push(card);
    }
  }
  gameDeck = knuthShuffle(newDeck);
  //console.log(gameDeck);
}

function buildPacks() {
  for (pack in PACK_STATE) {
    for (let i = 0; i < PACK_SIZE; i++) {
      PACK_STATE[pack].push(gameDeck.pop()); // pop the last element of the gameDeck into the pack
    }
    //console.log(PACK_STATE[pack]);
  } 
}

buildDeck();
buildPacks();

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function knuthShuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}
// ------- End of Draft Functions ----------------

// Character Related Functions
