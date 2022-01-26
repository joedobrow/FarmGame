const boardCardsWide = 5;
const boardCardsHigh = 5;
const cellSize = 90;
const spaceSize = 30;
const borderSize = 3;
const handSize = 9;
const boardWidth = (boardCardsWide * (cellSize + spaceSize)) + spaceSize;
const boardHeight = (boardCardsHigh * (cellSize + spaceSize)) + spaceSize;

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
               
              
let cards = ["none", "sheep", "hen", "squash", "bean", "corn", "hammer", "wrench", "saw", "shovel", "rooster"]


window.onload = () => {
  const socket = io();

  socket.on('starting_info', gameState => {
    loadBoard(gameState);
  });

  socket.on('game_state_update', gameState => {
    loadBoard(gameState);
  });
}

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

function loadBoard(gameState) {
  let newBoard = gameState['board'];
  for (let i = 0; i < newBoard.length; i++) {
    let boardCol = newBoard[i];
    for (let j = 0; j < boardCol.length; j++) {
      let newIndex = boardCol[j]['index'];
      updateTile(i, j, newIndex);
    }
  }
}

function updateTile(i, j, newIndex) {
  let tile = document.getElementById("tile_row" + i + "col" + j);
  changeTile(tile, newIndex);
}

function startBoard() {
    document.getElementById("playArea").style.display = "flex";
    document.getElementById("mainContainer").style.minWidth = (cellSize) * handSize + 150;
    document.getElementById("loadButton").style.display = "none";
    document.getElementById("resetButton").style.display = "block";
    document.getElementById("homeIcon").style.display = "none";
    document.getElementById("resourceBar").style.display = "block";
    removeAllChildren(document.getElementById("board"));
    createBoardRows();
    removeAllChildren(document.getElementById("hand"));
    createHand();
    removeAllChildren(document.getElementById("toolArea"));
    createToolArea();
    socket.emit('get_starting_info');
}

// Creates all of the rows on the game board and then populates them with tiles, alternating thin edge rows and thicker cell rows
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

function createHand() {
    for (let i = 0; i < handSize; i++) {
        let newCard = createElement("handCard", "handCard", (cellSize + borderSize), (cellSize + borderSize));
        newCard.setAttribute("onclick", "changeCell(this)");
        document.getElementById("hand").appendChild(newCard);
    }
}

function createToolArea() {
    let toolArea = document.getElementById("toolArea");
    let title = document.createElement("h3");
    title.setAttribute("class", "toolTitle");
    title.innerText = "Tools";
    toolArea.appendChild(title);
    toolArea.appendChild(createElement("tool", "hammer", (cellSize + borderSize), (cellSize + borderSize)));
    toolArea.appendChild(createElement("tool", "wrench", (cellSize + borderSize), (cellSize + borderSize)));
    toolArea.appendChild(createElement("tool", "saw", (cellSize + borderSize), (cellSize + borderSize)));
    toolArea.appendChild(createElement("tool", "shovel", (cellSize + borderSize), (cellSize + borderSize)));
    toolArea.appendChild(createElement("tool", "rooster", (cellSize + borderSize), (cellSize + borderSize)));
}

function removeAllChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function sendTileChange(cellElement) {
  socket.emit('board_action', { "x": cellElement.getAttribute('data-col'), "y": cellElement.getAttribute('data-row') });
}

function changeTile(tileElement, newIndex) {
  let type = tileElement.getAttribute("class");
  if (type == "boardCell") {
    changeCell(tileElement, newIndex);
  } else if (type == "boardEdge") {
    changeEdge(tileElement, newIndex);
  } else if (type == "boardCorner") {
    changeCorner(tileElement, newIndex);
  }
}

function changeCell(tileElement, newIndex) {
    removeAllChildren(tileElement);
    tileElement.style.backgroundColor = cells[newIndex]['color'];
    if (newIndex > 0) {
        let icon = document.createElement("img");
        icon.setAttribute("src", "./content/icons/" + cells[newIndex]['name'] + ".svg");
        icon.setAttribute("alt", cells[newIndex]['name']);
        icon.style.width = cellSize;
        icon.style.height = cellSize;
        tileElement.appendChild(icon);
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

function doubleCheck() {
    if (confirm('Are you sure you want to restart the game?')) {
        clearBoard();
        startBoard();
    }
}

function clearBoard() {
  socket.emit('clear_board');
}
