// Dependencies:
// npm install cookie-parser
// npm install express

// ---------- FARM GAME MAIN SERVER-SIDE JS -----------


// Variables

// IO related
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
// ------------------------------------------

const cookieParser = require("cookie-parser");
const path = require("path");

// Game State Related
const PLAYER_IDS = {};
const CELLS = ["none", "sheep", "hen", "bean", "corn"];
const EDGES = ["none", "fence", "canal"];
const BOARD_SIZE = 11;
const board = [];
const MAX_STRUCTURES = 5;
const MAX_CONTACTS = 5;
for (let i = 0; i < BOARD_SIZE; i++) {
  const row = []; 
  for (let j = 0; j < BOARD_SIZE; j++) { 
    row.push({ "index": 0, "player": -1, "type": getTileType(i, j)});
  }
  board.push(row);
}

let PLAYERS = [];

const GAME_STATE = { "board": board, 
                     "contacts": [],
                     "structures": [],
                     "resources": [], 
                     "hands": [] };

let CHARACTERS = { 'River': { 'canal': 2, 'well': 5, 'bean_not_touching_water': -3, 'animal': -1, 'outhouse': 2 },
                     'Wilder': { 'animal': 3, 'cornertile': -1, 'edgetile': -1, 'outhouse': 8, 'emptycell': 4 },
                     'Mason': { 'cornertile': 4, 'edgetile': 2, 'facetile': -1, 'outhouse': 4, 'wood': 1, 'stone': 1 },
                     'Fleece': { 'sheep': 3, 'corn': -2, 'squash': -2, 'outhouse': -2 },
                     'Helen': { 'chicken': 3, 'corn': -2, 'bean': -2, 'outhouse': -4 },
                     'Autumn': { 'tool': -5, 'rooster': -5, 'fence': -1, 'crop': -3, 'animal': 1 },
                     'Harmony': { 'cropset': 5, 'outhouse': 10, 'animal': -1, 'well': 5, 'slaughterhouse': -5 },
                     'Cash': { 'coin': 1 },
                     'Meadow': { 'pasture_size_2': 3, 'pasture_size_3': 5, 'pasture_size_4': 6, 'pasture_size_5': 12 } }


// Will need to only add character that belongs to user.
function chooseCharacter() {
  let i = 0;
  let rand = Math.floor(Math.random() * Object.keys(CHARACTERS).length);
  let character = Object.keys(CHARACTERS)[rand];
  let stats = CHARACTERS[character];
  delete CHARACTERS[character];
  return [character, stats];
}
// ------------------------------------------

// Draft State Related
const PACK_SIZE = 9;
const GAME_ROUNDS = 5;
let numPlayers = 2; // Need to be able to adjust this.
let currentDraftRound = 0;
let currentPickNum = 0;
let cardsTakenInRound = 0;

// PACK_STATE = { 'seat0pack0': ['corn', 'corn', 'sheep' ....], 'seat0pack1': [], ... }, 
let PACK_STATE = {};
for (let i = 0; i < (numPlayers); i++) {
  for (let j = 0; j < (GAME_ROUNDS); j++) {
    PACK_STATE["seat" + i + "pack" + j] = [];
  }
}
const gameCards = [ // resources
    {"text": "2 Sheep","amount": 10, "type": "resource"},
    {"text": "3 Sheep", "amount": 3, "type": "resource"},
    {"text": "2 Hens", "amount": 10, "type": "resource"},
    {"text": "3 Hens", "amount": 3, "type": "resource"},
    {"text": "2 Corn", "amount": 10, "type": "resource"},
    {"text": "3 Corn", "amount": 3, "type": "resource"},
    {"text": "2 Beans", "amount": 10, "type": "resource"},
    {"text": "3 Beans", "amount": 3, "type": "resource"},
    {"text": "2 Fences", "amount": 8, "type": "resource"},
    {"text": "3 Fences", "amount": 4, "type": "resource"},
    {"text": "4 Fences", "amount": 2, "type": "resource"},
    {"text": "1 Canal", "amount": 8, "type": "resource"},
    {"text": "2 Canals", "amount": 4, "type": "resource"},
    {"text": "3 Canals", "amount": 2, "type": "resource"},
    {"text": "1 Sheep and 1 Hen", "amount": 3, "type": "resource"},
    {"text": "1 Sheep and 1 Corn", "amount": 3, "type": "resource"},
    {"text": "1 Sheep and 1 Bean", "amount": 3, "type": "resource"},
    {"text": "1 Sheep and 1 Fence", "amount": 3, "type": "resource"},
    {"text": "1 Sheep and 1 Canal", "amount": 3, "type": "resource"},
    {"text": "1 Hen and 1 Corn", "amount": 3, "type": "resource"},
    {"text": "1 Hen and 1 Bean", "amount": 3, "type": "resource"},
    {"text": "1 Hen and 1 Fence", "amount": 3, "type": "resource"},
    {"text": "1 Hen and 1 Canal", "amount": 3, "type": "resource"},
    {"text": "1 Corn and 1 Bean", "amount": 3, "type": "resource"},
    {"text": "1 Corn and 1 Fence", "amount": 3, "type": "resource"},
    {"text": "1 Corn and 1 Canal", "amount": 3, "type": "resource"},
    {"text": "1 Bean and 1 Fence", "amount": 3, "type": "resource"},
    {"text": "1 Bean and 1 Canal", "amount": 3, "type": "resource"},
    {"text": "1 Fence and 1 Canal", "amount": 3, "type": "resource"},
    {"text": "Any 1 resource", "amount": 10, "type": "resource"},
    {"text": "Any 2 resources", "amount": 3, "type": "resource"},
    // objective
    {"text": "1 point per 3 sheep // 1 sheep", "amount": 1, "type": "objective"},
    {"text": "2 points per 5 hen // 1 hen", "amount": 1, "type": "objective"},
    {"text": "1 point per stack of sheep >= 2 // 1 fence", "amount": 1, "type": "objective"},
    {"text": "1 point per stack of corn >= 2 // 1 canal","amount": 1, "type": "objective"},
    {"text": "1 point per 3 corn // 1 corn","amount": 1, "type": "objective"},
    {"text": "2 points per 5 beans // 1 bean","amount": 1, "type": "objective"},
    {"text": "1 point per stack of animals >= 3 // 1 fence","amount": 1, "type": "objective"},
    {"text": "7 points if there are at least 12 beans // 1 bean","amount": 1, "type": "objective"},
    {"text": "9 points if there are at least 16 corn // 1 corn","amount": 1, "type": "objective"},
    {"text": "5 points if there are at least 9 sheep // 1 sheep","amount": 1, "type": "objective"},
    {"text": "8 points if there are at least 14 hens // 1 hen","amount": 1, "type": "objective"},
    {"text": "10 points if there are at least 9 pastures // 1 fence","amount": 1, "type": "objective"},
    {"text": "6 points if there are at least 9 canals // 1 canal","amount": 1, "type": "objective"},
    {"text": "2 points per empty square // take 1 resource off the board","amount": 1, "type": "objective"},
    {"text": "1 point per base VP arrangement // take 1 resource off the board","amount": 1, "type": "objective"},
    {"text": "1 point per length of longest canal // 1 canal","amount": 1, "type": "objective"},
    {"text": "1 point per length of longeset fence // 1 fence", "amount": 1, "type": "objective"},
    {"text": "12 points if corn are the most common resource // 1 corn","amount": 1, "type": "objective"},
    {"text": "12 points if beans are the most common resource // 1 bean","amount": 1, "type": "objective"},
    {"text": "12 points if sheep are the most common resource // 1 sheep","amount": 1, "type": "objective"},
    {"text": "12 points if hens are the most common resource // 1 hen","amount": 1, "type": "objective"},
    {"text": "1 point per pasture // 1 fence","amount": 1, "type": "objective"},
    {"text": "10 points if there are 4 empty squares","amount": 1, "type": "objective"},
    {"text": "2 points per stack of sheep >= 3","amount": 1, "type": "objective"},
    {"text": "2 points per stack of hen >= 3","amount": 1, "type": "objective"},
    {"text": "5 points per stack of crops >= 5","amount": 1, "type": "objective"},
    {"text": "4 points per horizontal/vertical farm row with no repeat resources","amount": 1, "type": "objective"},
    {"text": "10 points if you are the starting player","amount": 1, "type": "objective"},
    // Market Contacts
    {"text": "1 Sheep -> 2 Corn (x1) // 3 sheep -> Any 5 resources","amount": 1, "type": "contact"},
    {"text": "2 Sheep -> 3 Beans (x1) // 2 sheep and 1 bean -> 3 Beans and 3 canals","amount": 1, "type": "contact"},
    {"text": "3 Sheep -> 5 Hens (x1) // Any 3 animals -> Any 6 Animals","amount": 1, "type": "contact"},
    {"text": "2 Sheep -> Remove a resource (x1) // 2 Sheep and 1 fence -> Remove any 3 resources, and gain any 2 resources","amount": 1, "type": "contact"},
    {"text": "1 Sheep -> 1 Canal (x2) // 4 Sheep -> 3 Canals, and any 4 crops","amount": 1, "type": "contact"},
    {"text": "2 Sheep -> 3 Fences (x2) // 3 Sheep and 1 corn -> 7 fences","amount": 1, "type": "contact"},
    {"text": "1 Sheep -> Any resource (x2) // 2 sheep -> Any 4 resources","amount": 1, "type": "contact"},
    {"text": "1 Corn -> 2 Beans (x1) // 3 corn -> Any 5 resources","amount": 1, "type": "contact"},
    {"text": "2 Corn -> 3 Hens (x1) // 2 corn and 1 canal -> 3 hens and 3 fences","amount": 1, "type": "contact"},
    {"text": "3 Corn -> 4 Canals (x1) // Any 3 crops -> Any 6 Animals","amount": 1, "type": "contact"},
    {"text": "2 Corn -> Remove a resource (x1) // 2 corn and 1 canal -> Remove any 3 resources, and gain any 2 resource","amount": 1, "type": "contact"},
    {"text": "1 Corn -> 1 fence (x2) // 4 corn -> 4 fences, and any 4 animals","amount": 1, "type": "contact"},
    {"text": "2 Corn -> 3 Sheep (x2) // 3 corn and 1 bean -> 7 sheep","amount": 1, "type": "contact"},
    {"text": "1 Corn -> Any resource (x2) // 2 corn -> any 4 resources","amount": 1, "type": "contact"},
    {"text": "1 Bean -> 2 Hen (x1) // 3 bean -> Any 5 resources","amount": 1, "type": "contact"},
    {"text": "2 Bean -> 3 Canals (x1) // 2 bean and 1 fence -> 3 Canals and 3 corn","amount": 1, "type": "contact"},
    {"text": "3 Bean -> 5 Fences (x1) // Any 3 crops -> Any 6 crops","amount": 1, "type": "contact"},
    {"text": "2 Bean -> Remove a resource (x1) // 2 Bean and 1 sheep -> Remove any 3 resources, and gain any 2 resource","amount": 1, "type": "contact"},
    {"text": "1 Bean -> 1 Sheep (x2) // 4 Bean -> 3 Hens, and any 3 resources","amount": 1, "type": "contact"},
    {"text": "2 Bean -> 3 Corn (x2) // 3 Bean and 1 hen -> 7 corn","amount": 1, "type": "contact"},
    {"text": "1 bean -> Any resource (x2) // 2 bean -> any 4 resources","amount": 1, "type": "contact"},
    {"text": "1 Hen -> 2 Canals (x1) // 3 hen -> Any 5 resources","amount": 1, "type": "contact"},
    {"text": "2 Hen -> 3 fences (x1) // 2 hen and 1 corn -> 3 fences and 3 sheep","amount": 1, "type": "contact"},
    {"text": "3 Hen -> 5 sheep (x1) // Any 3 animals -> Any 6 Animals","amount": 1, "type": "contact"},
    {"text": "2 Hen -> Remove a resource (x1) // 2 hen and 1 bean -> Remove any 3 resources, and gain any 2 resource","amount": 1, "type": "contact"},
    {"text": "1 Hen -> 1 corn (x2) // 4 hens -> 3 Sheep, and any 3 resources","amount": 1, "type": "contact"},
    {"text": "2 Hen -> 3 bean (x2) // 3 hens and 1 sheep -> 7 bean","amount": 1, "type": "contact"},
    {"text": "1 hen -> Any resource (x2) // 2 hen -> any 4 resources","amount": 1, "type": "contact"},
    {"text": "3 Fences -> 2 Sheep (x2) // 5 Fences -> 7 Sheep","amount": 1, "type": "contact"},
    {"text": "3 Fences -> 2 Hen (x2) // 5 Fences -> 7 Hen","amount": 1, "type": "contact"},
    {"text": "2 Canals -> 2 Corn (x2) // 4 Canals -> 7 Corn","amount": 1, "type": "contact"},
    {"text": "2 Canals -> 2 Bean (x) // 4 Canals -> 7 Bean","amount": 1, "type": "contact"},
    {"text": "Any 2 resources -> Swap 2 tiles (x1) // Any 3 resources -> Swap 4 tiles","amount": 1, "type": "contact"},

    {"text": "Chicken Coop: Get 3 chickens, fenced chicken squares hold an additional chicken. Cost: 3 fences, 2 beans // 1 hen","amount": 1, "type": "structure"},
    {"text": "Antique Plow: Get any 4 crops, crop squares can hold an additional 1 crop. Cost: 2 market contacts // any 1 crop","amount": 1, "type": "structure"},
    {"text": "Slaughterhouse: Remove 2 animals, gain any 2 resources. Each harvest, starting player removes 1 animal. Cost: 1 sheep, 1 chick, 1 fence, 1 canal // 1 fence","amount": 1, "type": "structure"},
    {"text": "Irrigation network: Get 5 crops. crop squares can hold an additional 1 crop. Cost: 3 canals // 1 canal","amount": 1, "type": "structure"},
    {"text": "The Loom: Get 1 resource per tile with sheep. Sheep squares can hold an additional sheep. Cost: 2 fences, 3 sheep // 1 sheep","amount": 1, "type": "structure"},
    {"text": "Tractor: Remove 2 animals, gain any 2 resources. Each harvest, starting player removes 1 crop. Cost: 1 bean, 1 corn, 1 fence, 1 canal // 1 canal","amount": 1, "type": "structure"},
    {"text": "The Well: Get a sheep, a hen, a corn, a bean, a fence, and a canal. Each resources square can hold an additional resource. Cost: 5 canals // 1 canal","amount": 1, "type": "structure"},
    {"text": "The Slurry Pit: Remove 2 crops, gain any 2 resources. Each harvest, starting player removes 1 crop. Cost: 1 fence, 3 canals // 1 canal","amount": 1, "type": "structure"},
    {"text": "The Mother-in-law Suite: You may use a contact two additional times this turn. there are +2 max contacts. Cost: 2 fences, 1 bean // 1 fence","amount": 1, "type": "structure"},
    {"text": "The Japanese Garden: +1 max objectives, you may copy one of your objectives. Cost: 2 canals, 2 corn // 1 corn","amount": 1, "type": "structure"},
    {"text": "The roost: All players must place 1 extra hen during each of their play rounds. Cost: 5 corn // 1 corn","amount": 1, "type": "structure"},
  //  "The Greenhouse: All players draft an additional card each round. Cost: 2 fences, 1 canal, 1 bean // 1 bean": 1,
  //  "The Party House: All players draft 1 fewer card each round. Cost: 2 corn, 1 bean // 1 corn": 1,
    {"text": "The observation deck: All players get an +2 points per base objective. Cost: 1 of each resource // 1 of any resource","amount": 1, "type": "structure"},
    {"text": "The trough: All players must place 1 extra sheep during each of their play rounds. Cost: 5 beans // 1 bean","amount": 1, "type": "structure"},
    {"text": "The wire cage: All players must place 1 extra bean during each of their play rounds. Cost: 5 hens // 1 hen","amount": 1, "type": "structure"},
                ];
let gameDeck = [];
let drafting = false;

clearGameState();
// --------------------------------------

let HAND_STATE = [];
resetHands();
function resetHands() {
  HAND_STATE = [];
  for (let i = 0; i < numPlayers; i++) {
    HAND_STATE.push([]);
  }
}
// --------------------------------------
// Serve client-side files
app.use(express.static(path.join(__dirname, 'client')));
// mmm....Cookies
app.use(cookieParser());
// Do we need to run clearBoardState here ?

// Connection listeners / actions
// NOTE ON EMITTING:
// To send to sockets, use io.sockets.emit
// To just send to the 1 socket, use socket.emit
io.on('connection', function (socket) {
  console.log('a user connected');
  console.log("socket.id: " + socket.id)

  socket.on('get_starting_info', function(client_object) {
    playerConnect(socket, client_object);
    console.log(PLAYERS);
  });

  socket.on('board_action', function(client_object) {
    updateBoardTile(client_object.x, client_object.y);
    io.sockets.emit('board_state_update', board);
  });

  socket.on("quantity_action", function(client_object) {
    updateTileQuantity(client_object.x, client_object.y, client_object.increment);
    io.sockets.emit('board_state_update', board);
  });

  socket.on('clear_board', function(client_object) {
    clearGameState();
    io.sockets.emit('game_state_reset', GAME_STATE);
  });

  socket.on("start_draft", function(client_object) {
    io.sockets.emit("set_game_round", currentDraftRound + 1);
    if (currentDraftRound > 0) {
      startPack(socket);
    } else {
      startDraft(socket);
    }
  });

  socket.on("join_draft", function(client_object) {
    joinDraft(socket);
  });

  socket.on("draft_choice", function(client_object) {
    draftChoice(socket, client_object);
  });

  socket.on("push_card_action", function(client_object) {
    pushCard(client_object);
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
  for (let i = 0; i < BOARD_SIZE; i++) {
    const row = []; 
    for (let j = 0; j < BOARD_SIZE; j++) { 
      board[i][j]['index'] = 0;
      board[i][j]['player'] = -1;
      board[i][j]['type'] = getTileType(i, j);
      board[i][j]['quantity'] = 1;
    }
  }
  PLAYERS = [];
  setPlayerIds();
  drafting = false;
}

function setPlayerIds() {
  for (let i = 0; i < numPlayers; i++) {
    PLAYERS.push( { 'player': i, 'id': getNewId(), 'sent': false, 'socketId': -1, 'draftSeat': i, 'waitingForPick': false } );
  }
  for (let i = 0; i < numPlayers; i++) {
    console.log(PLAYERS[i]['id']);
  }
}

function getPlayerFromSocket(socket) {
  for (let i = 0; i < PLAYERS.length; i++) {
    if (PLAYERS[i]['socketId'] == socket.id) {
      return PLAYERS[i];
    }
  }
}
function getNewId() {
  return Math.floor(Math.random() * 1000000000000);
}

function playerConnect(socket, playerId) {
  // first check if connecting player is already in game
  for (let i = 0; i < PLAYERS.length; i++) {
    if (PLAYERS[i]['id'] == playerId) {
      PLAYERS[i]['socketId'] = socket.id;
      socket.emit('player-info', { 'playerId' : PLAYERS[i]['id'], 'playerNum' : PLAYERS[i]['player'] });
      socket.emit('starting_info', GAME_STATE);
      socket.emit('draft_info', drafting);
      socket.emit("character_info", chooseCharacter());
      return;
    }
  }

  // Next check if there's an open slot and if so, send them the player Id for the next open slot
  for (let i = 0; i < PLAYERS.length; i++) {
    if (PLAYERS[i]['sent'] == false) {
      PLAYERS[i]['sent'] = true;
      PLAYERS[i]['socketId'] = socket.id;
      socket.emit('player-info', { 'playerId' : PLAYERS[i]['id'], 'playerNum' : PLAYERS[i]['player'] });
      socket.emit('starting_info', GAME_STATE);
      socket.emit("character_info", chooseCharacter());
      return;
    }
  }
 
  // Otherwise...send 'game-full'
  socket.emit('game-full', true);
  return;
}

function updateBoardTile(x, y) {
  if (x != null && y != null && (0 <= x <= BOARD_SIZE) && (0 <= y <= BOARD_SIZE)) {
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

function getTypeAmount(type) { // MAGIC NUMBER ALERT
  if (type == "cell") {
    return CELLS.length;
  } else if (type == "edge") {
    return EDGES.length;
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

// -------------------------------------

// Draft functions
function startDraft(socket) {
  let numConnected = 0;
  for (let i = 0; i < PLAYERS.length; i++) {
    if (PLAYERS[i]['socketId'] != -1) {
      numConnected++;
    }
  }
  if (numConnected < numPlayers) {
    console.log("HERE: " + PLAYERS[1]);
    socket.emit("draft_not_full", { "numPlayers": numPlayers, "numConnected": numConnected });
  } else {
    buildDeck();
    buildPacks();
    logPackState();
    startPack(socket);
   }
}
function startPack(socket) {
  resetHands();
  io.sockets.emit("reset_hands");
  drafting = true;
  io.sockets.emit("draft_info", drafting);
  sendPack(socket);
}
function joinDraft(socket) {
  sendPack(socket);
  let playerIndex = getPlayerFromSocket(socket)['player'];
  socket.emit("card_to_hand", HAND_STATE[playerIndex]);
}
function logPackState() {
  for (pack in PACK_STATE) {
    console.log(pack + ": " + PACK_STATE[pack]);
  }
}

function sendPack(socket) {
  let player = getPlayerFromSocket(socket);   
  if (player["waitingForPick"] == false) {
    socket.emit("pack", PACK_STATE["seat" + player['draftSeat'] + "pack" + currentDraftRound]);
  }
}
function sendAllPacks() {
  for (let i = 0; i < numPlayers; i++) { 
    io.to(PLAYERS[i]['socketId']).emit("pack", PACK_STATE["seat" + PLAYERS[i]["draftSeat"] + "pack" + currentDraftRound]);
  }
}
function draftChoice(socket, cardIndex) {
  logPackState();
  let draftSeat = -1; // Which player sent us this?
  for (let i = 0; i < PLAYERS.length; i++) {
    if (PLAYERS[i]["socketId"] == socket.id) {
      draftSeat = PLAYERS[i]["draftSeat"];
    }
  }
  if (draftSeat == -1) {
    console.log("WHOOPS, non-existing player sent draft pick");
  } else {
    let pack = PACK_STATE["seat" + draftSeat + "pack" + currentDraftRound];
    if (PACK_SIZE - currentPickNum == pack.length && cardIndex > -1) {
      let playerIndex = getPlayerFromSocket(socket)['player'];
      HAND_STATE[playerIndex].push(pack[cardIndex]);
      socket.emit("card_to_hand", HAND_STATE[playerIndex]);
      pack.splice(cardIndex, 1);
      cardsTakenInRound++;
      PLAYERS[playerIndex]["waitingForPick"] = true;
      if (cardsTakenInRound >= numPlayers) {
        currentPickNum++;
        resetWaitingForPicks();
        switchDraftSeats();
        sendAllPacks();
        cardsTakenInRound = 0;
        if (currentPickNum == PACK_SIZE) { 
          endDraftRound();
        }
      }
    } else {
      console.log("WHOOPS, trying to remove card not in pack!!!");
    }
  }
}
function resetWaitingForPicks() {
  for (player in PLAYERS) {
    PLAYERS[player]["waitingForPick"] = false;
  }
}
function switchDraftSeats() {
  for (let i = 0; i < PLAYERS.length; i++) {
    PLAYERS[i]['draftSeat'] = (PLAYERS[i]['draftSeat'] + 1) % numPlayers;
  }
}
function endDraftRound() {
  currentPickNum = 0;
  currentDraftRound++;
  io.sockets.emit("end_draft_round");
  drafting = false;
}


function buildDeck() {
  let newDeck = [];
  for (let i = 0; i < numPlayers; i++) {
    for (let j = 0; j < GAME_ROUNDS; j++) {
      PACK_STATE["seat" + i + "pack" + j] = [];
    }
  }
  
  for (let i = 0; i < gameCards.length; i++) {
    for (let j = 0; j < gameCards[i]["amount"]; j++) {
      newDeck.push(gameCards[i]);
    }
  }
  gameDeck = knuthShuffle(newDeck);
  gameDeck = gameDeck.slice(0, (numPlayers * PACK_SIZE * GAME_ROUNDS));
  //console.log(gameDeck);
}

function buildPacks() {
  for (pack in PACK_STATE) {
    for (let i = 0; i < PACK_SIZE; i++) {
      PACK_STATE[pack].push(gameDeck.pop()); // pop the last element of the gameDeck into the pack
    }
  } 
}

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

// Contact / Structure related functions

function pushCard(client_object) {
  if (client_object["type"] == "structure" && GAME_STATE["structures"].length < MAX_STRUCTURES) {
    GAME_STATE["structures"].push(client_object["body"]);
    io.sockets.emit("structure_state_update", GAME_STATE["structures"]);
  } else if (client_object["type"] == "contact" && GAME_STATE["contacts"].length < MAX_CONTACTS) {
    GAME_STATE["contact"].push(client_object["body"]);
    io.sockets.emit("contact_state_update", GAME_STATE["contacts"]);
  }
}

// Character Related Functions
