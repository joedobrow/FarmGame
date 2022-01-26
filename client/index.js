const boardCardsWide = 5;
const boardCardsHigh = 5;
const cellSize = 90;
const spaceSize = 30;
const borderSize = 3;
const handSize = 9;
const boardWidth = (boardCardsWide * (cellSize + spaceSize)) + spaceSize;
const boardHeight = (boardCardsHigh * (cellSize + spaceSize)) + spaceSize;

let structures = ["none", "chickencoop", "library", "loom", "outhouse", "slaughterhouse", "tractor", "well"];
let tiles = ["none", "sheep", "hen", "squash", "bean", "corn"];
let cards = ["none", "sheep", "hen", "squash", "bean", "corn", "hammer", "wrench", "saw", "shovel", "rooster"]

window.onload = () => {
  const socket = io();

  socket.on('starting_info', gameState) => {
    loadBoard(gameState);
  };

  socket.on('game_state_update', gameState) => {
    loadBoard(gameState);
  };
}

function loadBoard(gameState) {
  
}

function loadBoard() {
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
}

function createBoardRows() {
    let firstSpace = createElement("boardSpace", "space0", boardWidth, spaceSize);
    document.getElementById("board").appendChild(firstSpace);
    fillBoardSpace(firstSpace);
    for (let i = 0; i < boardCardsHigh; i++) {
        let newRow = createElement("boardRow", i, boardWidth, cellSize);
        document.getElementById("board").appendChild(newRow);
        fillBoardRow(newRow);
        let newSpace = createElement("boardSpace", (i + 1), boardWidth, spaceSize);
        document.getElementById("board").appendChild(newSpace);
        fillBoardSpace(newSpace);
    }
}

function fillBoardSpace(rowElement) {
    let firstCorner = createElement("boardCorner", 0, 0, spaceSize, spaceSize);
    firstCorner.setAttribute("onclick", "changeTile(this)");
    rowElement.appendChild(firstCorner)
    for (let i = 0; i < boardCardsWide; i++) { // alternate making edges and corners
        let edge = createElement("boardEdge", rowElement.id, (i + 1), cellSize, spaceSize);
        edge.setAttribute("onclick", "changeTile(this)");
        rowElement.appendChild(edge);

        let corner = createElement("boardCorner", rowElement.id, (i + 1), spaceSize, spaceSize);
        corner.setAttribute("onclick", "changeTile(this)");
        rowElement.appendChild(corner);
    }
}

function fillBoardRow(rowElement) {
    let firstEdge = createElement("boardEdge", rowElement.id, 0, spaceSize, cellSize);
    firstEdge.setAttribute("onclick", "changeTile(this)");
    rowElement.appendChild(firstEdge)
    for (let i = 0; i < boardCardsWide; i++) { // alternate making cells and edges
        let cell = createElement("boardCell", rowElement.id, (i + 1), cellSize, cellSize);
        cell.setAttribute("onclick", "changeTile(this);");
        rowElement.appendChild(cell);
        
        let edge = createElement("boardEdge", rowElement.id, (i + 1), spaceSize, cellSize);
        edge.setAttribute("onclick", "changeTile(this)")
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

function createElement(eleClass, id, width, height) {
    let newElement = document.createElement("div");
    newElement.setAttribute("class", eleClass);
    newElement.setAttribute("id", id);
    newElement.style.width = width;
    newElement.style.height = height;
    return newElement;
}

function createTile(eleClass, x, y, width, height) {
  let newElement = document.createElement("div");
  newElement.setAttribute("class", eleClass);
  newElement.setAttribute("data-row", y);
  newElement.setAttribute("data-col", x);
  newElement.style.width = width;
  newElement.style.height = height;
  return newElement;
}

function removeAllChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

//generalized change tile function here
function changeTile(cellElement) {
// use div attributes data-col and data-row to track col and row
  socket.emit('board_action', { "x": cellElement.getAttribute('data-col'), "y": cellElement.getAttribute('data-row') });
}


function changeCell(cellElement) {
    removeAllChildren(cellElement);
    let colors = ["grey", "white", "goldenrod", "olivedrab", "burlywood", "gold"];
    let newIndex = 0;
    for (let i = 0; i < colors.length; i++) {
        if (cellElement.style.backgroundColor == colors[i] || cellElement.style.backgroundColor == "") {
            if (i == colors.length - 1) {
                newIndex = -1;
            }
            cellElement.style.backgroundColor = colors[newIndex + 1];
            if (newIndex != -1) {
                let icon = document.createElement("img");
                icon.setAttribute("src", "./content/icons/" + tiles[newIndex + 1] + ".svg");
                icon.setAttribute("onclick", "changeCell(this)");
                icon.setAttribute("alt", tiles[newIndex - 1]);
                icon.style.width = cellSize;
                icon.style.height = cellSize;
                cellElement.appendChild(icon);
            }
            break;
        }
        newIndex++;
    }
}

function changeEdge(cellElement) {
    let colors = ["black", "saddlebrown", "aqua"];
    let newIndex = 0;
    for (let i = 0; i < colors.length; i++) {
        if (cellElement.style.backgroundColor == colors[i] || cellElement.style.backgroundColor == "") {
            if (i == colors.length - 1) {
                newIndex = -1;
            }
            cellElement.style.backgroundColor = colors[newIndex + 1];
            break;
        }
        newIndex++;
    }
}

function changeCorner(cellElement) {
    removeAllChildren(cellElement);
    let colors = ["grey", "goldenrod", "yellow", "lightpink", "rosybrown", "tomato", "yellowgreen", "aqua"];
    let newIndex = 0;
    for (let i = 0; i < colors.length; i++) {
        if (cellElement.style.backgroundColor == colors[i] || cellElement.style.backgroundColor == "") {
            if (i == colors.length - 1) {
                newIndex = -1;
            }
            if (newIndex != -1) {
                let icon = document.createElement("img");
                icon.setAttribute("src", "./content/icons/" + structures[newIndex + 1] + ".svg");
                icon.setAttribute("onclick", "changeCorner(this)");
                icon.setAttribute("alt", structures[newIndex - 1]);
                icon.style.width = spaceSize;
                icon.style.height = spaceSize;
                cellElement.appendChild(icon);
            }
            cellElement.style.backgroundColor = colors[newIndex + 1];
            break;
        }
        newIndex++;
    }
}

function doubleCheck() {
    if (confirm('Are you sure you want to restart the game?')) {
        loadBoard();
    }
}
