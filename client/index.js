// FARM GAME MAIN CLIENT SIDE JS


let socket = io();
// Game Constants

// These are needed by backend as well, todo: have app.js send these at connection.
const boardCardsWide = 5;
const boardCardsHigh = 5;
const handSize = 9;
const maxStructures = 5; // It's actually 3, but there are cards that increase it
const maxContacts = 5; // It's actually 3, but there are cards that increase it
// Names are used by app.js, but colors are only for client.
let corners = [{ "name": "empty", "color": "black" },
               { "name": "chickencoop", "color": "goldenrod" },
               { "name": "library", "color": "yellow" },
               { "name": "loom", "color": "lightpink" },
               { "name": "outhouse", "color": "rosybrown" },
               { "name": "slaughterhouse", "color": "tomato" },
               { "name": "tractor", "color": "yellowgreen" },
               { "name": "well", "color": "aqua" }];

let cells =   [{ "name": "empty", "color": "grey" }, 
               { "name": "sheep", "color": "white" },
               { "name": "hen", "color": "goldenrod" },
     //          { "name": "squash", "color": "olivedrab" },
               { "name": "bean", "color": "burlywood" },
               { "name": "corn", "color": "gold" }];

let edges =   [{ "name": "empty", "color": "black" },
               { "name": "fence", "color": "saddlebrown" },
               { "name": "canal", "color": "aqua" }];

let RESOURCES = [{ "name": "empty", "color": "grey" }, 
               { "name": "sheep", "color": "white" },
               { "name": "hen", "color": "goldenrod" },
               { "name": "bean", "color": "burlywood" },
               { "name": "corn", "color": "gold" },
               { "name": "fence", "color": "saddlebrown" },
               { "name": "canal", "color": "aqua" }];


               
let cards = ["none", "sheep", "hen", "squash", "bean", "corn", "hammer", "wrench", "saw", "shovel", "rooster"]

let shopItems = { "hammer": [6, ""], 
                  "wrench": [6, ""], 
                  "saw": [6, ""], 
                  "shovel": [6, ""], 
                  "rooster": [6, ""],
                  "sheep": [3, ""],
                  "hen": [3, ""],
                  "squash": [3, ""],
                  "bean": [3, ""],
                  "corn": [3, ""],
                  "wood": [3, ""],
                  "stone": [3, ""],
                  "coffee": [2, "Become the starting player"] };

let gameFull = false;
let draftStarted = false;
let playerId = -1;
// -------------------------------

// These are not needed by backend
const cellSize = 90;
const spaceSize = 20;
const counterSize = 20;
const borderSize = 3;
const boardWidth = (boardCardsWide * (cellSize + spaceSize)) + spaceSize;
const boardHeight = (boardCardsHigh * (cellSize + spaceSize)) + spaceSize;
// -------------------------------


// Node Listeners
window.onload = () => {

  socket.on('starting_info', response => {
    buildGame(response);
  });

  socket.on('game_state_update', gameState => {
    loadBoard(gameState['board']);
  });

  socket.on('board_state_update', boardState => {
    loadBoard(boardState);
  });

  socket.on('game_state_reset', boardState => {
    restart();  
  });

  socket.on('game_full', isFull => {
    setGameFull(isFull);
  });

  socket.on('player_info', playerInfo => {
    setPlayerId(playerInfo['playerId']);
    setPlayerNum(playerInfo['playerNum']);
    setRoundNum(1);
  });

  socket.on("draft_info", draftInfo => {
    handleDraftInfo(draftInfo);
  });

  socket.on("reset_hands", response => {
    resetHand();
  });

  socket.on("pack", packState => {
    loadPack(packState);
  });

  socket.on("draft_not_full", response => {
    draftNotFull(response);
  });

  socket.on("card_to_hand", handState => {
    createHand(handState);
  });

  socket.on("character_info", characterInfo => {
    setCharacter(characterInfo);
  });

  socket.on("end_draft_round", response => {
    showPlayArea();
    handleDraftInfo(false);
  });
  
  socket.on("set_game_round", round => {
    setRoundNum(round);
  });

  socket.on("structure_state_update", response => {
    createStructureArea(response);
  });

  socket.on("contact_state_update", response => {
    createContactArea(response);
  });

  socket.on("update_resource", response => {
    createResourceArea(response);
  });

  socket.on('message', message => {
    console.log(message);
  });

}
// ------------------------------

// Helper functions
function createElement(eleClass, id, width, height) {
  let newElement = document.createElement("div");
  newElement.setAttribute("class", eleClass);
  newElement.setAttribute("id", id);
  newElement.style.width = width;
  newElement.style.height = height;
  return newElement;
}

function createTile(eleClass, eleId, x, y, width, height) {
  let newElement = document.createElement("div");
  newElement.setAttribute("class", eleClass);
  newElement.setAttribute("id", eleId);
  newElement.setAttribute("data-row", x);
  newElement.setAttribute("data-col", y);
  newElement.style.width = width;
  newElement.style.height = height;
  return newElement;
}

function removeAllChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
// ---------------------------

// Game State Functions
function startGame() {
  socket.emit('get_starting_info', getPlayerIdCookie());
}

function buildGame(response) {
  if (playerId == -1) {
    startBoard();
    createStructureArea(response["gameState"]["structures"]);
    createContactArea(response["gameState"]["contacts"]); 
    createHand(response["handState"]);
    createResourceArea(response["resourceState"]);
    document.getElementById("draftButton").style.display = "block";
    document.getElementById('characterSection').style.display = "block";
    loadBoard(response["gameState"]["board"]);
  } else if (gameFull) {
    showGameFull();
  }
}
function doubleCheckReset() {
  if (confirm("Are you sure you want to restart the game?")) {
    sendClearBoard();
  }
}
function doubleCheckDraft() {
  if (draftStarted) {
    joinDraft();
  } else if (confirm("Are you sure you want to start the Draft?")) {
    startDraft();
  }
}
function restart() {
  gameFull = false;
  playerId = -1;
  location.reload();
}
function playBah() {
  let clip = document.getElementById("bah");
  clip.autoPlay = true;
  clip.load();
}
function setGameFull(isFull) {
  gameFull = isFull;
  showGameFull();
}
function setPlayerId(playerId) {
  playerId = playerId;
  document.cookie = "farmGamePlayerId=" + playerId;
}
function setPlayerNum(playerNum) {
  let numBlock = document.getElementById("playerNum");
  numBlock.innerText = "Player " + (playerNum + 1);
}
function setRoundNum(roundNum) {
  let roundBlock = document.getElementById("roundNum");
  roundBlock.innerText = "Round " + roundNum;
}
function getPlayerIdCookie() {
  let name = "farmGamePlayerId=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function sendClearBoard() {
  socket.emit('clear_board');
}
function startDraft() {
  draftStarted = true;
  socket.emit("start_draft");
  document.getElementById("playArea").style.display = "none";
  document.getElementById("showPlayAreaButton").style.display = "block";
  document.getElementById("draftButton").style.display = "none";
  document.getElementById("draftArea").style.display = "block";
  buildDraftArea();
}
function joinDraft() {
  socket.emit("join_draft");
  document.getElementById("playArea").style.display = "none";
  document.getElementById("showPlayAreaButton").style.display = "block";
  document.getElementById("draftButton").style.display = "none";
  document.getElementById("draftArea").style.display = "block";
  buildDraftArea();
}

function showPlayArea() {
  document.getElementById("playArea").style.display = "flex";
  document.getElementById("showPlayAreaButton").style.display = "none";
  document.getElementById("draftButton").style.display = "block";
  document.getElementById('draftArea').style.display = "none";
}
function toggleAttributions(element) {
  let attributions = document.getElementById('attributionsContainer');
  if (attributions.style.display == 'block') {
    attributions.style.display = 'none';
  } else {
    attributions.style.display = 'block';
  }
}

// Game Board Functions
function startBoard() {
    document.getElementById("playArea").style.display = "flex";
    document.getElementById("mainContainer").style.minWidth = (cellSize) * handSize + 150;
    document.getElementById("loadButton").style.display = "none";
    document.getElementById("resetButton").style.display = "block";
    document.getElementById("homeIcon").style.display = "none";
    removeAllChildren(document.getElementById("board"));
    createBoardRows();
}
function createBoardRows() {
    let firstSpace = createElement("boardSpace", "boardRow0", boardWidth, spaceSize);
    firstSpace.setAttribute("data-row", 0);
    document.getElementById("board").appendChild(firstSpace);
    fillBoardSpace(firstSpace);
    for (let i = 0; i < boardCardsHigh * 2; i += 2) {
        let newRow = createElement("boardRow", "boardRow" + (i + 1), boardWidth, cellSize);
        newRow.setAttribute("data-row", i + 1);
        document.getElementById("board").appendChild(newRow);
        fillBoardRow(newRow);
        let newSpace = createElement("boardSpace", "boardRow" + (i + 2), boardWidth, spaceSize);
        newSpace.setAttribute("data-row", i + 2);
        document.getElementById("board").appendChild(newSpace);
        fillBoardSpace(newSpace);
    }
}
function fillBoardSpace(rowElement) {
    let rowNum = rowElement.getAttribute("data-row");
    let firstCorner = createTile("boardCorner", "tile_row" + rowNum + "col0", rowNum, 0, spaceSize, spaceSize);
    firstCorner.setAttribute("onclick", "sendTileChange(this)");
    rowElement.appendChild(firstCorner)
    for (let i = 0; i < boardCardsWide * 2; i += 2) { // alternate making edges and corners
        let edge = createTile("boardEdge", "tile_row" + rowNum + "col" + (i + 1), rowNum, (i + 1), cellSize, spaceSize);
        edge.setAttribute("onclick", "sendTileChange(this)");
        rowElement.appendChild(edge);

        let corner = createTile("boardCorner", "tile_row" + rowNum + "col" + (i + 2), rowNum, (i + 2), spaceSize, spaceSize);
        rowElement.appendChild(corner);
    }
}
function fillBoardRow(rowElement) {
    let rowNum = rowElement.getAttribute("data-row");
    let firstEdge = createTile("boardEdge", "tile_row" + rowNum + "col0", rowNum, 0, spaceSize, cellSize);
    firstEdge.setAttribute("onclick", "sendTileChange(this)");
    rowElement.appendChild(firstEdge)
    for (let i = 0; i < boardCardsWide * 2; i+= 2) { // alternate making cells and edges
        let cell = createTile("boardCell", "tile_row" + rowNum + "col" + (i + 1), rowNum, (i + 1), cellSize, cellSize);
        cell.setAttribute("onclick", "sendTileChange(this);");
        rowElement.appendChild(cell);
        
        let edge = createTile("boardEdge", "tile_row" + rowNum + "col" + (i + 2), rowNum, (i + 2), spaceSize, cellSize);
        edge.setAttribute("onclick", "sendTileChange(this)")
        rowElement.appendChild(edge);
    }
}
// ----- End of Game start board functions -----


// Takes a gameBoard object from backend and updates board
function loadBoard(gameBoard) {
  for (let i = 0; i < gameBoard.length; i++) {
    let boardCol = gameBoard[i];
    for (let j = 0; j < boardCol.length; j++) {
      updateTile(i, j, boardCol[j]['index'], boardCol[j]['quantity']);
    }
  }
}
function updateTile(i, j, newIndex, newQuantity) {
  let tile = document.getElementById("tile_row" + i + "col" + j);
  changeTile(tile, newIndex, newQuantity);
}
function changeTile(tileElement, newIndex, newQuantity) {
  let type = tileElement.getAttribute("class");
  if (type == "boardCell") {
    changeCell(tileElement, newIndex, newQuantity);
  } else if (type == "boardEdge") {
    changeEdge(tileElement, newIndex);
  } else if (type == "boardCorner") {
    changeCorner(tileElement, newIndex);
  }
}
function changeCell(tileElement, newIndex, newQuantity) {
    removeAllChildren(tileElement);
    tileElement.style.backgroundColor = cells[newIndex]['color'];
    if (newIndex > 0) {
        let icon = document.createElement("img");
        icon.setAttribute("src", "./content/icons/" + cells[newIndex]['name'] + ".svg");
        icon.setAttribute("alt", cells[newIndex]['name']);
        icon.style.width = cellSize;
        icon.style.height = cellSize;
        tileElement.appendChild(icon);

        let counter = createElement("counter", "counter" + tileElement.id, counterSize * 2, counterSize);
        counter.setAttribute("data-col", tileElement.getAttribute("data-col"));
        counter.setAttribute("data-row", tileElement.getAttribute("data-row"));

        let counterNum = document.createElement("div");
        counterNum.innerText = newQuantity;
        counterNum.setAttribute("class", "counterNum");
       
        let upClick = createElement("upClicker", "upClicker" + tileElement.id, counterSize, counterSize);
        upClick.setAttribute("onClick", "sendIncrement(this, 1); event.stopPropagation();");
     
        let downClick = createElement("downClicker", "downClicker" + tileElement.id, counterSize, counterSize);
        downClick.setAttribute("onClick", "sendIncrement(this, -1); event.stopPropagation();");

        counter.appendChild(counterNum);
        counter.appendChild(upClick);
        counter.appendChild(downClick);
        tileElement.appendChild(counter);
    }
    
}
function changeEdge(tileElement, newIndex) {
    tileElement.style.backgroundColor = edges[newIndex]['color'];
}
function changeCorner(tileElement, newIndex) {
    removeAllChildren(tileElement);
    tileElement.style.backgroundColor = corners[newIndex]['color'];
    if (newIndex > 0) {
        let icon = document.createElement("img");
        icon.setAttribute("src", "./content/icons/" + corners[newIndex]['name'] + ".svg");
        icon.setAttribute("alt", corners[newIndex]['name']);
        icon.style.width = spaceSize;
        icon.style.height = spaceSize;
        tileElement.appendChild(icon);
    }
}
function sendIncrement(element, amount) {
  let counter = element.parentElement;
  socket.emit("quantity_action", { "x": counter.getAttribute("data-col"), "y": counter.getAttribute("data-row"), "increment": amount });
}
// Called when a tile is clicked
function sendTileChange(cellElement) {
  socket.emit("board_action", { "x": cellElement.getAttribute("data-col"), "y": cellElement.getAttribute("data-row") });
}
// ------------- End of Game Board Functions -----------

// Structure/Contact Area Functions

// Initialize
function createStructureArea(structures) {
  let structureArea = document.getElementById("structureArea");
  removeAllChildren(structureArea);
  let title = document.createElement("h3");
  title.setAttribute("class", "sidebarTitle");
  title.innerText = "Structures";
  structureArea.appendChild(title);
  for (let i = 0; i < maxStructures; i++) {
    let newStructure = createElement("sidebarCard", "structureCard" + i, (cellSize + borderSize), (cellSize + borderSize));
    structureArea.appendChild(newStructure);
  }
  updateStructures(structures);
}
function removeStructure(index) {
  if (confirm("Are you sure you want to remove this structure?")) {
    socket.emit("remove_structure", index);
  }
}
function removeContact(index) {
  if (confirm("Are you sure you want to remove this contact?")) {
    socket.emit("remove_contact", index);
  }
} 
function createContactArea(contacts) {
  let contactArea = document.getElementById("contactArea");
  removeAllChildren(contactArea);
  let title = document.createElement("h3");
  title.setAttribute("class", "sidebarTitle");
  title.innerText = "Contacts";
  contactArea.appendChild(title);
  for (let i = 0; i < maxContacts; i++) {
    let newContact = createElement("sidebarCard", "contactCard" + i, (cellSize + borderSize), (cellSize + borderSize));
    contactArea.appendChild(newContact);
  }
  updateContacts(contacts);
}
function updateStructures(structures) {
  for (let i = 0; i < structures.length; i++) {
    let structureCard = document.getElementById("structureCard" + i);
    structureCard.innerText = structures[i];
    let closeButton = createElement("closeButton", "structureCloseButton" + i, 30, 30);
    let closeIcon = document.createElement("img");
    closeIcon.setAttribute("src", "./content/icons/x.svg");
    closeIcon.setAttribute("alt", "close");
    closeIcon.setAttribute("class", "closeIcon");
    closeIcon.setAttribute("onclick", "removeStructure(" + i + ");");
    closeButton.appendChild(closeIcon);
    structureCard.appendChild(closeButton); 

  }
}
function updateContacts(contacts) {
  for (let i = 0; i < contacts.length; i++) {
    let contactCard = document.getElementById("contactCard" + i);
    contactCard.innerText = contacts[i];
    let closeButton = createElement("closeButton", "contactCloseButton" + i, 30, 30);
    let closeIcon = document.createElement("img");
    closeIcon.setAttribute("src", "./content/icons/x.svg");
    closeIcon.setAttribute("alt", "close");
    closeIcon.setAttribute("class", "closeIcon");
    closeIcon.setAttribute("onclick", "removeContact(" + i + ");");
    closeButton.appendChild(closeIcon);
    contactCard.appendChild(closeButton); 
 }
}
// ------ End of Structure/Contact Area functions -------

// Hand Functions
function createHand(handState) {
  removeAllChildren(document.getElementById("hand"));
  for (let i = 0; i < handSize; i++) {
    let newCard = createElement("handCard", "handCard" + i, (cellSize + borderSize), (cellSize + borderSize));
    newCard.setAttribute("onclick", "toggleHand(this)");
    document.getElementById("hand").appendChild(newCard);
  }
  if (handState != null) {
    for (let i = 0; i < handState.length; i++) {
      let cardElement = document.getElementById("handCard" + i);
      cardElement.innerText = handState[i]["text"];
      if (handState[i]["type"] == "structure" || handState[i]["type"] == "contact") {
        let pushButton = createElement("pushButton", "pushButtonhandCard" + i, 30, 30);
        let upArrow = document.createElement("img");
        upArrow.setAttribute("src", "./content/icons/uparrow.svg");
        upArrow.setAttribute("alt", "arrow");
        upArrow.setAttribute("class", "upArrow");
        upArrow.setAttribute("onclick", "pushCard('" + handState[i]["type"] + "', '" + handState[i]["text"] +"');");
        pushButton.appendChild(upArrow); 
        cardElement.appendChild(pushButton);
      }
    }
  }
}
function pushCard(type, body) {
  socket.emit("push_card_action", { "type": type, "body": body });
}
function toggleHand(handElement) {
  let pushButton = document.getElementById("pushButton" + handElement.getAttribute("id"));
  if (handElement.style.color == "grey") {
    handElement.style.color = "black";
    if (pushButton != null) {
      pushButton.style.display = "block";
    }
  } else {
    handElement.style.color = "grey";
    if (pushButton != null) {
      pushButton.style.display = "none";
    }
  }
}
function resetHand() {
  for (let i = 0; i < handSize; i++) {
    let card = document.getElementById("handCard" + i);
    card.innerText = "";
    card.style.color = "black";
  }
}
// ---------- End of Hand Functions -------------------------------


// Draft Area Functions
function buildDraftArea() {
  let draftBoard = document.getElementById("draftBoard");
  removeAllChildren(draftBoard);
  for (let i = 0; i < handSize; i++) {
    let newCard = document.createElement("div");
    newCard.setAttribute("class", "draftCard");
    newCard.setAttribute("id", "draftCard" + i);
    let titleArea = document.createElement("div");
    titleArea.setAttribute("class", "draftCardTitle");
    titleArea.setAttribute("id", "draftCardTitle" + i);
    let bodyArea = document.createElement("div");
    bodyArea.setAttribute("class", "draftCardBody");
    bodyArea.setAttribute("id", "draftCardBody" + i);
    newCard.appendChild(titleArea);
    newCard.appendChild(bodyArea);
    draftBoard.appendChild(newCard);
  }
}

function loadPack(packState) {
  console.log(packState);
  for (let i = 0; i < packState.length; i++) {
      console.log(packState[i]);
      let cardTitle = document.getElementById("draftCardTitle" + i);
      cardTitle.innerText = packState[i]["type"].charAt(0).toUpperCase() + packState[i]["type"].slice(1);
      let cardBody = document.getElementById("draftCardBody" + i);
      cardBody.innerText = packState[i]["text"].replace("//", "\n\n");
      let card = document.getElementById("draftCard" + i);
      card.setAttribute("onclick", "pickCard('" + i + "', " + (handSize - packState.length) + ")");
  }  
}
function pickCard(cardIndex, pickNumber) {
  socket.emit("draft_choice", cardIndex);
  clearDraft();
}
function handleDraftInfo(draftInfo) {
  draftStarted = draftInfo;
  let draftButton = document.getElementById("draftButton");
  if (draftStarted) {
    draftButton.setAttribute("class", "draftStarted");
  } else {
    draftButton.setAttribute("class", "");
  }
}
function clearDraft() {
  for (let i = 0; i < handSize; i++) {
    let draftCardTitle = document.getElementById("draftCardTitle" + i);
    draftCardTitle.innerText = "";
    let draftCardBody = document.getElementById("draftCardBody" + i);
    draftCardBody.innerText = "";
  }
}
function draftNotFull(response) {
  alert("Cannot start draft, only " + response["numConnected"] + " out of " + response["numPlayers"] + " ready.");
  draftStarted = false;
  showPlayArea();
} 
// ------------ End of Draft Area Functions ------------------------

// Character Functions
function setCharacter(characterInfo) {
  let card = document.getElementById('characterCard');
  removeAllChildren(card)
  let title = document.createElement('h3');
  title.setAttribute('class', 'characterCardTitle');
  let listHolder = document.createElement('div');
  listHolder.setAttribute('class', 'listHolder');

  title.innerText = characterInfo[0];
  card.appendChild(title);
  card.appendChild(listHolder);
  let newList = document.createElement('ul');
  newList.setAttribute('id', 'conditionList');
  for (condition in characterInfo[1]) {
    let cond = document.createElement('li');
    midString = ' points per ';
    if (characterInfo[1][condition] == 1 || characterInfo[1][condition] == -1) {
      midString = ' point per ';
    }
    cond.innerText = characterInfo[1][condition] + ' points per ' + condition.replaceAll('_', ' ');
    newList.appendChild(cond);
  }
  listHolder.appendChild(newList);
  card.appendChild(listHolder);
}

// Shop functions
document.addEventListener("DOMContentLoaded", function () {
  buildShop();
});
function buildShop() {
  let shop = document.getElementById("shop");
  for (item in shopItems) {
    let row = document.createElement("div");
    row.setAttribute("class", "shopRow");
    let col1 = document.createElement("div");
    col1.setAttribute("class", "shopItemName shopCol");
    col1.innerText = item;
    let col2 = document.createElement("div");
    col2.setAttribute("class", "shopItemCost shopCol");
    col2.innerText = shopItems[item][0];
    let col3 = document.createElement("div");
    col3.setAttribute("class", "shopItemText shopCol");
    col3.innerText = shopItems[item][1];
    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    shop.appendChild(row);
  }
}
// --------- End of Shop ------------

// Resource Area

function createResourceArea(resources) {
  let resourceArea = document.getElementById("resourceBar");
  removeAllChildren(resourceArea);
  for (resource in resources) {
    let newResource = createElement("resourceCard", "resourceCard" + resource, cellSize, cellSize);
    
    let icon = document.createElement("img");
    icon.setAttribute("src", "./content/icons/" + resource + ".svg");
    icon.setAttribute("alt", resource);
    icon.style.width = cellSize;
    icon.style.height = cellSize;
    newResource.appendChild(icon);
    for (let i = 0; i < RESOURCES.length; i++) {
      if (RESOURCES[i]["name"] == resource) { 
        newResource.style.backgroundColor = RESOURCES[i]["color"];
      }
    }
    let counter = createElement("counter", "resourceCounter" + resource, counterSize * 2, counterSize);
       
    let counterNum = document.createElement("div");
    counterNum.innerText = resources[resource];
    counterNum.setAttribute("class", "counterNum");
 
    let upClick = createElement("upClicker", "upClicker" + resource, counterSize, counterSize);
    upClick.setAttribute("onClick", "sendResourceIncrement('" + resource + "', 1);");
 
    let downClick = createElement("downClicker", "downClicker" + resource, counterSize, counterSize);
    downClick.setAttribute("onClick", "sendResourceIncrement('" + resource + "', -1);");
 
    counter.appendChild(counterNum);
    counter.appendChild(upClick);
    counter.appendChild(downClick);
    newResource.appendChild(counter);
    resourceArea.appendChild(newResource);
  }
}

function sendResourceIncrement(resource, amount) {
  socket.emit("resource_update", {"resource" : resource, "amount":  amount})
}

// ---------- End of Resource Area ------


// Modal
function showShop() {
  let modal = document.getElementById("shopCard");
  modal.style.display = "block";
}
function closeShop() {
  let modal = document.getElementById("shopCard");
  modal.style.display = "none";
}
function showGameFull() {
console.log("showGameFull");
  let fullElement = document.getElementById("gameFullCard");
  fullElement.style.display = "block";
}
function closeGameFull() {
  let modal = document.getElementById("gameFullCard");
  modal.style.display = "none";
}
window.onclick = function(event) {
  let modals = document.querySelectorAll('.modal');
  if (event.target.classList.contains("modal")) {
    for (var index in modals) {
      if (typeof modals[index].style != "undefined") modals[index].style.display = "none";    
    }
  }
}
