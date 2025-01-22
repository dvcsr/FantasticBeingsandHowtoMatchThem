//*========== infrastructure variables ==========*//
const creatures = ["kelpie", "puffskein", "salamander", "swooping", "zouwu"];
let firstClick = null; //to capture first click event
let secondClick = null; //and second click event in implementation;
let mapLen;
let points = 0;
const clickSoundEffect = new Audio("./sounds_animation/click.wav");
const matchSoundEffect = new Audio("./sounds_animation/match.wav");

//*========== game config ==========*//
const finalGoal = { zouwu: 3, kelpie: 0 }; //game goal to win
const currentGoal = { zouwu: 0, kelpie: 0 }; //in game user progress
let moves = 10; //game moves
let mapLenconfig = 5; //for map size

//*========== infrastructure methods ==========*//
window.renderMap = function (rowsCount, colsCount) {
    mapLen = rowsCount;
    const map = document.getElementById("map");

    removeAllEventListeners();

    map.style.setProperty("--rows-count", rowsCount);
    map.style.setProperty("--cols-count", colsCount);

    map.innerHTML = "";

    for (let row = 0; row < rowsCount; row++) {
        let rowEl = document.createElement("tr");
        for (let col = 0; col < colsCount; col++) {
            const cell = document.createElement("td");
            cell.classList.add("cell");
            cell.dataset.coords = `x${col}_y${row}`;
            rowEl.appendChild(cell);
            cell.addEventListener("click", cellClickHandler);
        }
        map.appendChild(rowEl);
    }
};

window.clearMap = function () {
    const map = document.getElementById("map");
    map.innerHTML = "";
};

window.renderCreatures = function () {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
        const creature = creatures[Math.floor(Math.random() * creatures.length)];
        fillCellWithCreature(cell, creature);
    });
};

function fillCellWithCreature(cell, creature) {
    cell.dataset.being = creature;
    const img = document.createElement("img");
    img.src = `./assets/${creature}.png`;
    img.alt = creature;
    img.dataset.coords = cell.dataset.coords;
    cell.appendChild(img);
}

window.redrawMap = function (creaturesArray) {
    const rowsCount = creaturesArray.length;
    const colsCount = creaturesArray[0].length;

    if (rowsCount < 3 || colsCount < 3) return false;

    removeAllEventListeners();

    window.clearMap();
    window.renderMap(rowsCount, colsCount);


    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        const row = Math.floor(index / colsCount);
        const col = index % colsCount;
        const creature = creaturesArray[row][col];
        if (creature) {
            cell.innerHTML = "";
            fillCellWithCreature(cell, creature);
            console.log('being are modified: from redrawMap method')
        }
    });
    return true;
};

function removeAllEventListeners() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
        cell.removeEventListener("click", cellClickHandler);
    });
}

function cellClickHandler(event) {
    if (checkWinOrLose()) return;
    const cells = document.querySelectorAll(".cell");
    const cell = event.currentTarget;

    if (!firstClick) {
        firstClick = cell;
        firstClick.classList.add("selected");
        clickSoundEffect.play()
          .catch((error) => console.warn("Click sound effect error:", error));
        secondClick = null;
        cells.forEach((cell) => {
            if (areNeighbors(firstClick, cell)) {
                cell.classList.add("marked");
            }
        })
    } else {
        if (!secondClick) {
            secondClick = cell;
            if (areNeighbors(firstClick, secondClick)) {
                swapCreatures(firstClick, secondClick);
                if (checkForMatchesWithPoint()) {
                    console.log('being are modified: from click method (there are matches)')
                    moves--;
                    updateStatusBar()
                    matchSoundEffect.play()
                      .catch((error) => console.warn("Match sound effect error:", error));
                    if (checkWinOrLose()) return;
                } else {
                    moves--;
                    swapCreatures(firstClick, secondClick);
                    updateStatusBar();

                }
                firstClick.classList.remove("selected");
                secondClick.classList.remove("selected");
                cells.forEach((cell) => {
                    cell.classList.remove("marked")
                    firstClick = null;
                    secondClick = null;
                    if (checkWinOrLose()) return;
                })
            } else {
                /*
                code commented: no cancel click method
                code uncommented: cancel first click if second click goes to non-neighbour click
                 */
                // firstClick.classList.remove("selected");
                // secondClick.classList.remove("selected");
                // cells.forEach((cell) => {
                //     cell.classList.remove("marked");
                // }
                // firstClick = null;
            }
        }
    }
}

function areNeighbors(cell1, cell2) {
    const [x1, y1] = cell1.dataset.coords.slice(1).split("_y").map(Number);
    const [x2, y2] = cell2.dataset.coords.slice(1).split("_y").map(Number);

    return (
        (Math.abs(x1 - x2) === 1 && y1 === y2) ||
        (Math.abs(y1 - y2) === 1 && x1 === x2)
    );
}

function swapCreatures(cell1, cell2) {
    const tempBeing = cell1.dataset.being;
    const tempImg = cell1.querySelector("img").src;

    cell1.dataset.being = cell2.dataset.being;
    cell1.querySelector("img").src = cell2.querySelector("img").src;

    cell2.dataset.being = tempBeing;
    cell2.querySelector("img").src = tempImg;
}

function checkForMatchesWithPoint() {
    const cells = Array.from(document.querySelectorAll(".cell"));
    const twoDimensionsCells = [];
    for (let i = 0; i < cells.length; i += mapLen) {
        twoDimensionsCells.push(cells.slice(i, i + mapLen));
    }

    let hasMatch = false;
    const matches = countMatches(twoDimensionsCells);

    if (matches.length > 0) {
        hasMatch = true;

        matches.forEach(({ row, col }) => {
            const cell = twoDimensionsCells[row][col];
            const being = cell.dataset.being;
            if (being && being in currentGoal) {
                currentGoal[being]++;
                points += 10;
            }
            cell.classList.add("disappear-animation");
            cell.dataset.being = "";
            cell.innerHTML = "";
            cell.addEventListener("animationend", () => cell.classList.remove("disappear-animation"));
            const creature = window.generateRandomBeingName();
            fillCellWithCreature(cell, creature);
            console.log('check for matches: being modified')
        });
        handleUnintentionalMatchesWithPoint();
        updateStatusBar()
    }
    return hasMatch;
}

function countMatches(twoDimensionsCells) {
    let matches = [];

    twoDimensionsCells.forEach((row, rowIndex) => {
        let matchLength = 1;

        for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
            const currentCell = row[colIndex];
            const nextCell = row[colIndex + 1];

            if (
                nextCell &&
                currentCell.dataset.being === nextCell.dataset.being &&
                currentCell.dataset.being
            ) {
                matchLength += 1;
            } else {
                if (matchLength >= 3) {
                    for (let i = 0; i < matchLength; i += 1) {
                        matches.push({
                            row: rowIndex,
                            col: colIndex - i,
                        });
                    }
                }
                matchLength = 1;
            }
        }
    });

    for (let colIndex = 0; colIndex < twoDimensionsCells[0].length; colIndex += 1) {
        let matchLength = 1;

        for (let rowIndex = 0; rowIndex < twoDimensionsCells.length; rowIndex += 1) {
            const currentCell = twoDimensionsCells[rowIndex][colIndex];
            const nextCell = twoDimensionsCells[rowIndex + 1] ? twoDimensionsCells[rowIndex + 1][colIndex] : null;

            if (
                nextCell &&
                currentCell.dataset.being === nextCell.dataset.being &&
                currentCell.dataset.being
            ) {
                matchLength += 1;
            } else {
                if (matchLength >= 3) {
                    for (let i = 0; i < matchLength; i += 1) {
                        matches.push({
                            row: rowIndex - i,
                            col: colIndex,
                        });
                    }
                }
                matchLength = 1;
            }
        }
    }

    return matches;
}

window.generateRandomBeingName = function () {
    return creatures[Math.floor(Math.random() * creatures.length)];
};

function checkWinOrLose() {
    const footer = document.getElementById("game-footer");
    let zouwuCount = finalGoal.zouwu - currentGoal.zouwu;
    let kelpieCount = finalGoal.kelpie - currentGoal.kelpie;

    if ( zouwuCount <= 0 && kelpieCount <= 0){
        //win logic
        moves = 0;
        footer.textContent = "You won! Reload the page to start the game again.";
        removeAllEventListeners();
        updateStatusBar()
        return true;

    } else if (moves <= 0 || isMatchesEmpty()) {
        //lost logic
        moves = 0;
        footer.textContent = "You lost! Reload the page to start the game again.";
        removeAllEventListeners();
        updateStatusBar();
        return true;
    }
    return false;
}

function updateStatusBar() {
    moves <= 0 ? document.getElementById("moves-value").textContent = String('0')
        : document.getElementById("moves-value").textContent = String(moves);

    document.getElementById("score-value").textContent = points;

    let zouwuCount = finalGoal.zouwu - currentGoal.zouwu;
    zouwuCount <= 0 ? document.querySelector(".zouwu").textContent = '0'
        : document.querySelector(".zouwu").textContent = String(zouwuCount);

    let kelpieCount = finalGoal.kelpie - currentGoal.kelpie;
    kelpieCount <= 0 ? document.querySelector(".kelpie").textContent = '0'
        : document.querySelector(".kelpie").textContent = String(kelpieCount);
}

function setupNewGame (){
    let footer = document.getElementById("game-footer");
    footer.textContent = "Swap animals to form a sequence of three in a row";
    let movesEl = document.getElementById("moves-value");
    movesEl.textContent = String(moves);
    updateStatusBar();
}

function checkMatchesWithoutPoint(){
    const cells = Array.from(document.querySelectorAll(".cell"));
    const twoDimensionsCells = [];
    for (let i = 0; i < cells.length; i += mapLen) {
        twoDimensionsCells.push(cells.slice(i, i + mapLen));
    }

    let hasMatch = false;
    const matches = countMatches(twoDimensionsCells);

    if (matches.length > 0) {
        hasMatch = true;

        matches.forEach(({ row, col }) => {
            const cell = twoDimensionsCells[row][col];
            cell.classList.add("disappear-animation");
            cell.dataset.being = "";
            cell.innerHTML = "";
            cell.addEventListener("animationend", () => cell.classList.remove("disappear-animation"));
            const creature = window.generateRandomBeingName();
            fillCellWithCreature(cell, creature);
        });

        updateStatusBar()
    }
    return hasMatch;
}

function handleUnintentionalMatches (){
    do {
        console.log('check match without point:', checkMatchesWithoutPoint());
    } while (checkMatchesWithoutPoint())
    console.log('being are modified to handle unintentional matches')
}

function handleUnintentionalMatchesWithPoint () {
    do {
        console.log(checkForMatchesWithPoint());
    } while (checkForMatchesWithPoint())
}

function isMatchesEmpty (){
    let isEmpty = false;
    const cells = Array.from(document.querySelectorAll(".cell")); //1D array of cells
    const twoDimensionsCells = [];
    for (let i = 0; i < cells.length; i += mapLen) {
        twoDimensionsCells.push(cells.slice(i, i + mapLen));
    } //2D array of cells
    if (checkNoMorePossibleMatches(twoDimensionsCells)) {
        isEmpty = true;
        moves = 0;
        footer.textContent = "You lost! Reload the page to start the game again.";
        updateStatusBar();

    }
    return isEmpty;

}

function checkNoMorePossibleMatches(array2D) {
    // Try every possible swap and check for potential matches
    for (let row = 0; row < array2D.length; row++) {
        for (let col = 0; col < array2D[0].length; col++) {
            // Check right swap
            if (col < array2D[0].length - 1) {
                if (hasMatchAfterSwap(array2D, row, col, row, col + 1)) {
                    return false; // Found a possible match
                }
            }

            // Check down swap
            if (row < array2D.length - 1) {
                if (hasMatchAfterSwap(array2D, row, col, row + 1, col)) {
                    return false; // Found a possible match
                }
            }
        }
    }
    return true; // No possible matches found
}

function hasMatchAfterSwap(array2D, row1, col1, row2, col2) {
    // Create a deep copy of the grid
    const tempGrid = array2D.map(row => [...row]);

    // Perform the swap
    const temp = tempGrid[row1][col1];
    tempGrid[row1][col1] = tempGrid[row2][col2];
    tempGrid[row2][col2] = temp;

    // Check for matches using existing findMatches logic
    let hasMatch = false;

    // Check horizontal
    tempGrid.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length - 2; colIndex++) {
            const current = row[colIndex];
            const next = row[colIndex + 1];
            const nextNext = row[colIndex + 2];

            if (
              current.dataset.being &&
              current.dataset.being === next.dataset.being &&
              next.dataset.being === nextNext.dataset.being &&
              current.dataset.being in finalGoal
            ) {
                hasMatch = true;
            }
        }
    });

    // Check vertical
    for (let colIndex = 0; colIndex < tempGrid[0].length; colIndex++) {
        for (let rowIndex = 0; rowIndex < tempGrid.length - 2; rowIndex++) {
            const current = tempGrid[rowIndex][colIndex];
            const next = tempGrid[rowIndex + 1][colIndex];
            const nextNext = tempGrid[rowIndex + 2][colIndex];

            if (
              current.dataset.being &&
              current.dataset.being === next.dataset.being &&
              next.dataset.being === nextNext.dataset.being &&
              current.dataset.being in finalGoal
            ) {
                hasMatch = true;
            }
        }
    }

    return hasMatch;
}

//========** init game **========//

window.addEventListener("load", function () {
    window.renderMap(mapLenconfig, mapLenconfig);
    renderCreatures();
    setupNewGame();
    handleUnintentionalMatches();
})

