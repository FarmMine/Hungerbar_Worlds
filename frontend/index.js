// console.log("DO NOT OPEN THIS! IGNORE EVERYTHING! THIS WILL GET YOU HACKED, DO NOT DO ANYTHING HERE AND DO NOT SHARE THE INFORMATION WHICH YOU SEE ON THE WEBSITE!")
const BG_COLOUR = 'rgba(35, 31, 32, 1)';
const FOOD_COLOUR = 'rgba(227, 115, 131, 1)';
const BEDROCK_COLOUR = 'rgba(128, 0, 128, 1)';
const socket = io('http://localhost:3000/');
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('image', image => {
    gameCodeDisplay.innerHTML = `<img id="EGG"src="data:image/png;base64,${image}" width="50" height="50">`;
});
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const gameCodeInput = document.getElementById('gameCodeInput');

const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const joinPubButton = document.getElementById('joinPubButton');
joinPubButton.addEventListener('click', joinPub);
newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function handleInit(playerCount) {
    // console.log("There are " + playerCount + "players.")
}

function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    if (code === "") {
        alert("In order to join a private game, you must include a game code.")
        return;
    }
    socket.emit('joinGame', code);
    init();
    gameCodeDisplay.innerText = code
}

function joinPub() {
    socket.emit('joinPUBLIC', "PUBLIC");
    init();
}

let canvas, ctx;
let gameActive = false;

function init() {
    document.getElementById('initialScreen').style.display = "none";
    document.getElementById('gameScreen').style.display = "block";
    document.getElementById("messages").style.display = "block";
    document.getElementById("form").style.display = "flex";
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOUR;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    gameActive = true;
}

function keydown(e) {
    // console.log(e.keyCode)
    socket.emit('keydown', e.keyCode);
}

function keyup(e) {
    // console.log(e.keyCode)
    socket.emit('keyup', e.keyCode);
}

function keypress(e) {
    // console.log(e.keyCode)
    socket.emit('keypress', e.keyCode);
}
const rgba = (Argb) => {
    const rgb = Argb.replace('A', '');
    const r = parseInt(rgb.substring(0, 3));
    const g = parseInt(rgb.substring(3, 6));
    const b = parseInt(rgb.substring(6, 9));
    const a = parseInt(rgb.substring(9, 12));
    return `rgba(${r},${g},${b},${a / 100})`;
};
var gameTick;

function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    if (!state) {
        return;
    }
    gameTick = state.gameTick;
    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;
    const bedrock = state.bedrock;
    for (let i = 8; i < Object.keys(state).length; i++) {
        ctx.fillStyle = rgba(Object.keys(state)[i]);
        ctx.beginPath();
        state[Object.keys(state)[i]][0].pos.forEach(({
            x,
            y
        }) => ctx.rect(x * size, y * size, size, size));
        ctx.fill();
    }
    Object.entries(state.backgrounds).forEach(([key, value]) => {
        if (value !== null && typeof value == "object") {
            ctx.fillStyle = rgba(key);
            ctx.beginPath();
            state.backgrounds[key][0].pos.forEach(({
                x,
                y
            }) => ctx.rect(x * size, y * size, size, size));
            ctx.fill();
        }
    })
    Object.entries(state.blocks).forEach(([key, value]) => {
        if (value !== null && typeof value == "object") {
            ctx.fillStyle = rgba(key);
            ctx.beginPath();
            state.blocks[key][0].pos.forEach(({
                x,
                y
            }) => ctx.rect(x * size, y * size, size, size));
            ctx.fill();
        }
    })
    try {
        var img = document.getElementById("EGG");
        ctx.drawImage(img, food.x * size, food.y * size, 10, 10);
    } catch (error) {
        ctx.fillStyle = FOOD_COLOUR;
        ctx.beginPath();
        ctx.rect(food.x * size, food.y * size, 10, 10);
        ctx.fill();
    }
    for (let x of state.players) {
        paintPlayer(x, size);
    }
    for (let x of state.players) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.rect(x.pos.x * size, x.pos.y * size, size, size);
        ctx.fill();
    }
    ctx.fillStyle = BEDROCK_COLOUR;
    ctx.beginPath();
    ctx.rect(bedrock.x * size, bedrock.y * size, size, size);
    ctx.fill();
    Object.entries(state.liquids).forEach(([key, value]) => {
        if (value !== null && typeof value == "object") {
            ctx.fillStyle = rgba(key);
            ctx.beginPath();
            state.liquids[key][0].pos.forEach(({
                x,
                y
            }) => ctx.rect(x * size, y * size, size, size));
            ctx.fill();
        }
    })
}

function paintPlayer(playerState, size) {
    /*
        for (let i = 0; i < Object.keys(item).length; i++) {
            ctx.fillStyle = rgba(Object.keys(item)[i]);
            ctx.beginPath();
            Object.values(item).forEach(({ x, y }) => ctx.rect(x * size, y * size, size, size));
            ctx.fill();
        }*/
    let value5, value6;
    if (playerState.itemList !== null && typeof playerState.itemList == "object") {
        Object.entries(playerState.itemList).forEach(([key, value]) => {
            if (value !== null && typeof value == "object") {
                Object.entries(value).forEach(([key, value]) => {
                    if (value !== null && typeof value == "object") {
                        Object.entries(value).forEach(([key, value]) => {
                            if (value !== null && typeof value == "object") {
                                if (Object.keys(value)[1] == "animationFrame2") {
                                    if (gameTick % 10 == 1) {
                                        if ((value.animationFrame1) !== null && typeof(value.animationFrame1) == "object") {
                                            value5 = (Object.keys(value.animationFrame1))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame1))[0].x * size, (Object.values(value.animationFrame1))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 2) {
                                        if ((value.animationFrame2) !== null && typeof(value.animationFrame2) == "object") {
                                            value5 = (Object.keys(value.animationFrame2))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame2))[0].x * size, (Object.values(value.animationFrame2))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 3) {
                                        if ((value.animationFrame3) !== null && typeof(value.animationFrame3) == "object") {
                                            value5 = (Object.keys(value.animationFrame3))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame3))[0].x * size, (Object.values(value.animationFrame3))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 4) {
                                        if ((value.animationFrame4) !== null && typeof(value.animationFrame4) == "object") {
                                            value5 = (Object.keys(value.animationFrame4))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame4))[0].x * size, (Object.values(value.animationFrame4))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 5) {
                                        if ((value.animationFrame5) !== null && typeof(value.animationFrame5) == "object") {
                                            value5 = (Object.keys(value.animationFrame5))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame5))[0].x * size, (Object.values(value.animationFrame5))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 6) {
                                        if ((value.animationFrame6) !== null && typeof(value.animationFrame6) == "object") {
                                            value5 = (Object.keys(value.animationFrame6))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame6))[0].x * size, (Object.values(value.animationFrame6))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 7) {
                                        if ((value.animationFrame7) !== null && typeof(value.animationFrame7) == "object") {
                                            value5 = (Object.keys(value.animationFrame7))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame7))[0].x * size, (Object.values(value.animationFrame7))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 8) {
                                        if ((value.animationFrame8) !== null && typeof(value.animationFrame8) == "object") {
                                            value5 = (Object.keys(value.animationFrame8))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame8))[0].x * size, (Object.values(value.animationFrame8))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 9) {
                                        if ((value.animationFrame9) !== null && typeof(value.animationFrame9) == "object") {
                                            value5 = (Object.keys(value.animationFrame9))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame9))[0].x * size, (Object.values(value.animationFrame9))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }
                                    if (gameTick % 10 == 0) {
                                        if ((value.animationFrame10) !== null && typeof(value.animationFrame10) == "object") {
                                            value5 = (Object.keys(value.animationFrame10))[0];
                                            ctx.fillStyle = rgba(value5);
                                            ctx.beginPath();
                                            ctx.rect((Object.values(value.animationFrame10))[0].x * size, (Object.values(value.animationFrame10))[0].y * size, size, size);
                                            ctx.fill();
                                        }
                                    }

                                } else {
                                    Object.entries(value).forEach(([key, value]) => {
                                        if (value !== null && typeof value == "object") {
                                            Object.entries(value).forEach(([key, value]) => {
                                                value5 = key;
                                                if (value !== null && typeof value == "object") {
                                                    if (value5) {
                                                        ctx.fillStyle = rgba(value5);
                                                        ctx.beginPath();
                                                        ctx.rect(value.x * size, value.y * size, size, size);
                                                        ctx.fill();
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }

                });
            }
        });
    } else {
        // jsonObj is a number or string
    }
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }
    gameActive = false;
    alert('You were kicked out of the world!');
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
    reset();
    alert('Unknown Game Code')
}

function handleTooManyPlayers() {
    reset();
    alert('The world has too many players!');
}

function reset() {
    gameCodeInput.value = '';
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}