// FARM GAME MAIN CLIENT SIDE JS

// Game Constants

// These are needed by backend as well, todo: have app.js send these at connection.
const boardCardsWide = 5;
const boardCardsHigh = 5;
const handSize = 9;

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
               { "name": "squash", "color": "olivedrab" },
               { "name": "bean", "color": "burlywood" },
               { "name": "corn", "color": "gold" }];

let edges =   [{ "name": "empty", "color": "black" },
               { "name": "fence", "color": "saddlebrown" },
               { "name": "canal", "color": "aqua" }];
               
let toolNames = ["hammer", "wrench", "saw", "shovel", "rooster"];

let cards = ["none", "sheep", "hen", "squash", "bean", "corn", "hammer", "wrench", "saw", "shovel", "rooster"]
// -------------------------------

// These are not needed by backend
const cellSize = 90;
const spaceSize = 30;
const counterSize = 20;
const borderSize = 3;
const boardWidth = (boardCardsWide * (cellSize + spaceSize)) + spaceSize;
const boardHeight = (boardCardsHigh * (cellSize + spaceSize)) + spaceSize;
// -------------------------------

// Node Listeners
window.onload = () => {
  const socket = io();

  socket.on('starting_info', gameState => {
    loadBoard(gameState['board']);
    updateToolArea(gameState['tools']);
    setCharacter(gameState['character']);
  });

  socket.on('game_state_update', gameState => {
    loadBoard(gameState['board']);
    updateToolArea(gameState['tools']);
  });

  socket.on('board_state_update', boardState => {
    loadBoard(boardState);
  });

  socket.on('tool_state_update', tools => {
    updateToolArea(tools);
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
    startBoard();
    removeAllChildren(document.getElementById("toolArea"));
    createToolArea();
    removeAllChildren(document.getElementById("hand"));
    createHand();
    document.getElementById("draftButton").style.display = "block";
    socket.emit('get_starting_info');
    document.getElementById('characterSection').style.display = 'block';
}
function doubleCheck() {
    if (confirm('Are you sure you want to restart the game?')) {
        sendClearBoard();
        startGame();
    }
}
function sendClearBoard() {
  socket.emit('clear_board');
}
function startDraft() {
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
    document.getElementById("resourceBar").style.display = "block";
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
        corner.setAttribute("onclick", "sendTileChange(this)");
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

// Tool Area Functions

// Initialize
function createToolArea() {
    let toolArea = document.getElementById("toolArea");
    let title = document.createElement("h3");
    title.setAttribute("class", "toolTitle");
    title.innerText = "Tools";
    toolArea.appendChild(title);
    for (let i = 0; i < toolNames.length; i++) {
        let newTool = createElement("tool", toolNames[i], (cellSize + borderSize), (cellSize + borderSize));
        newTool.setAttribute("onclick", "sendTool(this);");
        toolArea.appendChild(newTool);
    }
}
// Called when backend sends a game state update
function updateToolArea(tools) {
  for (const tool in tools) {
    changeTool(tool, tools[tool]);
  } 
}
function changeTool(toolName, isActive) {
    let toolElement = document.getElementById(toolName);
    removeAllChildren(toolElement) 
    if (isActive) {
        let icon = document.createElement("img");
        icon.setAttribute("src", "./content/icons/" + toolElement.getAttribute("id") + ".svg");
        icon.setAttribute("alt", toolElement.getAttribute("id"));
        icon.style.width = cellSize;
        icon.style.height = cellSize;
        toolElement.appendChild(icon);
        toolElement.style.backgroundColor = "white";
    } else {
        toolElement.style.backgroundColor = "grey";
    }
}
// Called when a tool is clicked, emits data to backend
function sendTool(toolElement) {
  let toolName = toolElement.getAttribute("id");
  socket.emit('tool_action', { 'tool': toolName });
}
// --------- End of Tool Functions -------------


// Hand Functions
function createHand() {
    for (let i = 0; i < handSize; i++) {
        let newCard = createElement("handCard", "handCard", (cellSize + borderSize), (cellSize + borderSize));
        newCard.setAttribute("onclick", "changeCell(this)");
        document.getElementById("hand").appendChild(newCard);
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
    draftBoard.appendChild(newCard);
  }
}
    
// ------------ End of Draft Area Functions ------------------------

// Character Functions
function setCharacter(character) {
  let card = document.getElementById('characterCard');
  removeAllChildren(card)
  let title = document.createElement('h3');
  title.setAttribute('class', 'characterCardTitle');
  let listHolder = document.createElement('div');
  listHolder.setAttribute('class', 'listHolder');
  for (key in character) {
    title.innerText = key;
    card.appendChild(title);
    card.appendChild(listHolder);
    let newList = document.createElement('ul');
    newList.setAttribute('id', 'conditionList');
    for (condition in character[key]) {
        let cond = document.createElement('li');
        midString = ' points per ';
        if (character[key][condition] == 1 || character[key][condition] == -1) {
            midString = ' point per ';
        }
        cond.innerText = character[key][condition] + ' points per ' + condition.replaceAll('_', ' ');
        newList.appendChild(cond);
    }
    listHolder.appendChild(newList);
    card.appendChild(listHolder);
    break;
  }
}
