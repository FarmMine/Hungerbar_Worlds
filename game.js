const GRID_SIZE = 200;
const {
    worldTiles
} = require('./worldTiles');
const {
    worldBlocks
} = require('./worldBlocks');
const {
    worldBackgrounds
} = require('./worldBackgrounds');
const {
    worldLiquids
} = require('./worldLiquids');
module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity,
}

function initGame() {
    var state = createGameState()
    randomFood(state);
    state = worldTiles(state);
    state = worldBlocks(state);
    state = worldBackgrounds(state);
    const state1 = worldLiquids(state);
    return state1;
}

function createGameState() {
    return {
        gameTick: 0,
        gridsize: GRID_SIZE,
        players: [],
        food: {},
        bedrock: {},
        liquids: {},
        blocks: {},
        backgrounds: {},
    };
}
/*
GAME RULES
PLAYERS CAN ALWAYS GO THRU THE CORNER BLOCK WITH (1;1)SPEED

downRightBlock
downLeft
upRight
upLeftBlock
downBlock
upBlock
rightBlock
leftBlock
every player has upBlock and downBlock
This means when collision is detected on the downBlock it puts a positive number because Y is positive when moving down
the positive number is the same as the number the collision system has in memory, it means if it had 4 then it is 4
it only checked 4 blocks below the player and the collision made sure that those are all air so the player should still have vel of 4
if there was a collision then the system gets a tag/state that there was a collision at this vel of Y
when there is another collision it checks if that tag is not higher than the another collision (so if it had collision at y of 2 then y of 4 should not change the state to 4)
(so if the collision was at y of -2 then y of -4 should not be applied to the tag)
It checks if it bigger than 0 then the another collision can not be higher than the previous collision
it checks if it smaller than 0 then the another collision can not be lower than the previous collision
Obviously first checks if the tag exists first.
When all the collisions are done the up or downblock will be the number of the collision, meaning that when it is applied the player is inside the block
so to avoid the player going inside the block, the upBlock or downBlock should always be added or subtracted 1 (negative number gets 1 added and positive number gets 1 subtracted)
This is the fix for things which need to know how many blocks are above or below the player

The same system of that should be added to X collision (leftBlock and rightBlock)
(1;1 is down right, -1;-1 is up left, -1;1 is down left, 1;-1 is up right)
OKAY we use this for moving on a flat platform, when there is no block in front of the player and vel is high, it should go to the left or right block-1
If there is no up or right block then X does not snap to the left or rightblock and the player just runs
This is the fix for the player not snapping to the wall and things which need to know how many blocks are left or right to the player

There is the same system with corners, there are 4 corners tho
downRightBlock
upLeftBlock
downLeft
upRight
*/
function gameLoop(state) {
    if (!state) {
        return;
    }
    let playerList = {};
    for (var i = 0; i < Object.keys(state.players).length; i++) {
        // for every player add them to the list
        playerList["player" + i] = state.players[i];

        // friction (*0.85) to stop the player from moving when he stopped moving (otherwise the player is always moving with constant x vel)
        // trunc removes all the comma values so 1.951anything becomes 1 and same about negative numbers -1.23 becomes -1 
        playerList["player" + i].vel.x = Math.trunc(playerList["player" + i].vel.x * 0.85);

        // gravity (+1) to make the player fall to the ground
        // (playerList["player" + i].vel.y < 3) is the player's falling speed, higher the number the faster the fall
        // and the player pos.y must not be 0 or lower
        // and the player pos.y must not be higher than the grid size-1 the (-1) is there because the grid is from 0 to 199 (when it 199 then the player is on the border and we cannot go below the bedrock)
        if (playerList["player" + i].vel.y < 3 && !(playerList["player" + i].pos.y < 0) && !(playerList["player" + i].pos.y >= GRID_SIZE - 1)) {
            // Okay so do not make the player fall when it is touching the ground
            // when player has a collision with the top side of the block, the player gets a tag of "flying=1"
            // the tag goes away after the frame it was tagged so it will not last past this gravity check (people break the block below you at any moment)
            // the tag gets removed when we use it in this gravity thing and gets readded when player again touches the ground
            // so it literally only lasts for that one frame when the player touched the block, the next frame gravity works again and
            // the second frame checks the top block again and adds that state
            // Basically 1. flying=1 when vel of y is 1 and collision with only y (the player stopped moving right or left)
            // floor because it always rounds it down so 5.95anything is 5(slower falling speed) and -4.001anything is -5 (makes the player jump higher)
            // if player is not on the ground then gravity works again
            if (playerList["player" + i].flying !== 1) {
                playerList["player" + i].vel.y = Math.floor(playerList["player" + i].vel.y + 1)
            } else if (playerList["player" + i].flying === 1) {
                // this means the past block we were standing maybe is not below us anymore so make sure to add flying=0 (means player is falling again)
                // This will change to 1 (when the player is on the ground) when collision sees a block below the player
                playerList["player" + i].flying = 0;
            }
            // else if the player is above the world's 199 or higher (below the bedrock)
        } else if (playerList["player" + i].pos.y >= GRID_SIZE - 1) {
            // push the player back up
            playerList["player" + i].vel.y = -10;
        }
        // Remove all the near block information
        playerList["player" + i].downRightBlock = {};
        playerList["player" + i].downLeft = {};
        playerList["player" + i].upRight = {};
        playerList["player" + i].upLeftBlock = {};
        playerList["player" + i].downBlock = 999;
        playerList["player" + i].upBlock = -999;
        playerList["player" + i].rightBlock = 999;
        playerList["player" + i].leftBlock = -999;
        //check collision and adds near block information when possible and also special blocks
        playerList["player" + i] = checkCollision(playerList["player" + i], state.blocks, "blocks")
        playerList["player" + i] = checkCollision(playerList["player" + i], state.liquids, "liquids")
        playerList["player" + i].pos.x += playerList["player" + i].vel.x;
        playerList["player" + i].pos.y += playerList["player" + i].vel.y;
        // If they have vel then push the cells towards it and remove the tail
        if ((playerList["player" + i].vel.x || playerList["player" + i].vel.y) && !(playerList["player" + i].pos.x < 0 || playerList["player" + i].pos.x >= GRID_SIZE || playerList["player" + i].pos.y < 0 || playerList["player" + i].pos.y >= GRID_SIZE)) {
            let value1, value2, value3, value4, value5, value6;
            if (playerList["player" + i].itemList !== null && typeof playerList["player" + i].itemList == "object") {
                Object.entries(playerList["player" + i].itemList).forEach(([key, value]) => {
                    value1 = key;
                    if (value !== null && typeof value == "object") {
                        Object.entries(value).forEach(([key, value]) => {
                            value2 = key;
                            if (value !== null && typeof value == "object") {
                                Object.entries(value).forEach(([key, value]) => {
                                    value3 = key;
                                    if (value !== null && typeof value == "object") {
                                        Object.entries(value).forEach(([key, value]) => {
                                            value4 = key;
                                            if (value !== null && typeof value == "object") {
                                                Object.entries(value).forEach(([key, value]) => {
                                                    value5 = key;
                                                    if (value !== null && typeof value == "object") {
                                                        Object.entries(value).forEach(([key, value]) => {
                                                            value6 = key;
                                                            if (value6 === "x") {
                                                                playerList["player" + i].itemList[value1][value2][value3][value4][value5][value6] += playerList["player" + i].vel.x;
                                                            } else if (value6 === "y") {
                                                                playerList["player" + i].itemList[value1][value2][value3][value4][value5][value6] += playerList["player" + i].vel.y;
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else if (playerList["player" + i].pos.y < 0 || playerList["player" + i].pos.y >= GRID_SIZE) {
            if (!(playerList["player" + i].pos.x < 0 || playerList["player" + i].pos.x >= GRID_SIZE)) {
                if (playerList["player" + i].itemList !== null && typeof playerList["player" + i].itemList == "object") {
                    Object.entries(playerList["player" + i].itemList).forEach(([key, value]) => {
                        value1 = key;
                        if (value !== null && typeof value == "object") {
                            Object.entries(value).forEach(([key, value]) => {
                                value2 = key;
                                if (value !== null && typeof value == "object") {
                                    Object.entries(value).forEach(([key, value]) => {
                                        value3 = key;
                                        if (value !== null && typeof value == "object") {
                                            Object.entries(value).forEach(([key, value]) => {
                                                value4 = key;
                                                if (value !== null && typeof value == "object") {
                                                    Object.entries(value).forEach(([key, value]) => {
                                                        value5 = key;
                                                        if (value !== null && typeof value == "object") {
                                                            Object.entries(value).forEach(([key, value]) => {
                                                                value6 = key;
                                                                if (value6 === "x") {
                                                                    playerList["player" + i].itemList[value1][value2][value3][value4][value5][value6] += playerList["player" + i].vel.x;
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }

        } else if (playerList["player" + i].pos.x < 0 || playerList["player" + i].pos.x >= GRID_SIZE) {
            if (playerList["player" + i].itemList !== null && typeof playerList["player" + i].itemList == "object") {
                Object.entries(playerList["player" + i].itemList).forEach(([key, value]) => {
                    value1 = key;
                    if (value !== null && typeof value == "object") {
                        Object.entries(value).forEach(([key, value]) => {
                            value2 = key;
                            if (value !== null && typeof value == "object") {
                                Object.entries(value).forEach(([key, value]) => {
                                    value3 = key;
                                    if (value !== null && typeof value == "object") {
                                        Object.entries(value).forEach(([key, value]) => {
                                            value4 = key;
                                            if (value !== null && typeof value == "object") {
                                                Object.entries(value).forEach(([key, value]) => {
                                                    value5 = key;
                                                    if (value !== null && typeof value == "object") {
                                                        Object.entries(value).forEach(([key, value]) => {
                                                            value6 = key;
                                                            if (value6 === "y") {
                                                                playerList["player" + i].itemList[value1][value2][value3][value4][value5][value6] += playerList["player" + i].vel.y;
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
        // If the player is outside the allowed area push him back where he came from
        if (playerList["player" + i].pos.x < 0 || playerList["player" + i].pos.x >= GRID_SIZE || playerList["player" + i].pos.y < 0 || playerList["player" + i].pos.y >= GRID_SIZE) {
            if (playerList["player" + i].pos.x < 0) {
                playerList["player" + i].pos.x -= playerList["player" + i].vel.x;
            }
            if (playerList["player" + i].pos.x >= GRID_SIZE) {
                playerList["player" + i].pos.x -= playerList["player" + i].vel.x;
            }
            if (playerList["player" + i].pos.y < 0) {
                playerList["player" + i].pos.y -= playerList["player" + i].vel.y;
            }
            if (playerList["player" + i].pos.y >= GRID_SIZE) {
                playerList["player" + i].pos.y -= playerList["player" + i].vel.y;
            }
            if (!(playerList["player" + i].pos.y >= (GRID_SIZE - 1))) {
                playerList["player" + i].vel = {
                    x: 0,
                    y: 0
                };
            } else {
                playerList["player" + i].vel = {
                    x: 0,
                    y: 0
                };
            }
        }
        // If the food is on the players head then add that head position to the itemList with 1 x and y offset so the itemList gets bigger
        if (state.food.x + 1 === playerList["player" + i].pos.x && state.food.y === playerList["player" + i].pos.y - 1) {
            if (!playerList["player" + i].itemList.food) {
                playerList["player" + i].itemList["food"] = {}
                playerList["player" + i].itemList["food"]["foodItem"] = {
                    "count": 1,
                    "animationFrames": {
                        animationFrame1: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 2,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 3,
                            },
                        },
                        animationFrame2: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 3,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 4,
                            },
                        },
                        animationFrame3: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 4,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 5,
                            },
                        },
                        animationFrame4: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 3,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 4,
                            },
                        },
                        animationFrame5: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 2,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 3,
                            },
                        },
                        animationFrame6: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 1,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 2,
                            },
                        },
                        animationFrame7: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 2,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 3,
                            },
                        },
                        animationFrame8: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 3,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 4,
                            },
                        },
                        animationFrame9: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 2,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 3,
                            },
                        },
                        animationFrame10: {
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y - 3,
                            },
                            "A255255000100": {
                                "x": playerList["player" + i].pos.x,
                                "y": playerList["player" + i].pos.y + 4,
                            },
                        },
                    }
                }
            } else {
                playerList["player" + i] = creaseObject(playerList["player" + i], "foodItem", "count", 1, "+");
            }
            randomFood(state);
        }


    }
    // Add 1 to the game ticks
    state.gameTick++;
    // console.log("I am still alive " + state.gameTick);

    /* The same as the loop above
    if (Object.keys(playerList).length !== 0) {
    for (let i = 0; i < Object.keys(playerList).length; i++) {
    }}*/

    // game is still going on
    return false;
}

function drawPlayer(player) {
    let value1, value2, value3, value4, value5, value6;
    if (player.itemList !== null && typeof player.itemList == "object") {
        Object.entries(player.itemList).forEach(([key, value]) => {
            value1 = key;
            if (value !== null && typeof value == "object") {
                Object.entries(value).forEach(([key, value]) => {
                    value2 = key;
                    if (value !== null && typeof value == "object") {
                        Object.entries(value).forEach(([key, value]) => {
                            value3 = key;
                            if (value !== null && typeof value == "object") {
                                Object.entries(value).forEach(([key, value]) => {
                                    value4 = key;
                                    if (value !== null && typeof value == "object") {
                                        Object.entries(value).forEach(([key, value]) => {
                                            value5 = key;
                                            if (value !== null && typeof value == "object") {
                                                Object.entries(value).forEach(([key, value]) => {
                                                    value6 = key;
                                                    if (value6 === "x") {
                                                        player.itemList[value1][value2][value3][value4][value5][value6] += player.vel.x;
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    if (player.itemList !== null && typeof player.itemList == "object") {
        Object.entries(player.itemList).forEach(([key, value]) => {
            value1 = key;
            if (value !== null && typeof value == "object") {
                Object.entries(value).forEach(([key, value]) => {
                    value2 = key;
                    if (value !== null && typeof value == "object") {
                        Object.entries(value).forEach(([key, value]) => {
                            value3 = key;
                            if (value !== null && typeof value == "object") {
                                Object.entries(value).forEach(([key, value]) => {
                                    value4 = key;
                                    if (value !== null && typeof value == "object") {
                                        Object.entries(value).forEach(([key, value]) => {
                                            value5 = key;
                                            if (value !== null && typeof value == "object") {
                                                Object.entries(value).forEach(([key, value]) => {
                                                    value6 = key;
                                                    if (value6 === "y") {
                                                        player.itemList[value1][value2][value3][value4][value5][value6] += player.vel.y;
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    return player;
}

function checkCollision(player, blocks, mode) {
    if (mode === "blocks") {
        if (player.vel.x || player.vel.y) {
            Object.entries(blocks).forEach(([key, value]) => {
                if (value !== null && typeof value == "object") {
                    blocks[key][0].pos.forEach(({
                        x,
                        y
                    }) => {
                        let blockX = x;
                        let blockY = y;
                        let current_X_Vel = player.vel.x;
                        let current_Y_Vel = player.vel.y;
                        if (current_X_Vel < 0) {
                            var first_X_Vel = -1;
                        } else if (current_X_Vel > 0) {
                            var first_X_Vel = 1;
                        }
                        if (current_Y_Vel < 0) {
                            var first_Y_Vel = -1;
                        } else if (current_Y_Vel > 0) {
                            var first_Y_Vel = 1;
                        }
                        if (current_X_Vel === 0) {
                            var first_X_Vel = 0;
                        }
                        if (current_Y_Vel === 0) {
                            var first_Y_Vel = 0;
                        }
                        if (player.vel.x != 0 && player.vel.y != 0) {
                            while (first_X_Vel < current_X_Vel || first_X_Vel > current_X_Vel) {
                                if (player.pos.x + first_X_Vel >= blockX &&
                                    player.pos.x + first_X_Vel <= blockX &&
                                    player.pos.y >= blockY &&
                                    player.pos.y <= blockY) {
                                    player.vel.x = 0;
                                    if (first_X_Vel >= 0 && player.rightBlock >= first_X_Vel) {
                                        player.rightBlock = first_X_Vel;
                                        // console.log("rightBlock")
                                        // console.log(player.rightBlock)
                                        if (player.rightBlock > 1) {
                                            player.vel.x = 1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                    if (first_X_Vel <= 0 && player.leftBlock <= first_X_Vel) {
                                        player.leftBlock = first_X_Vel;
                                        // console.log("leftBlock")
                                        // console.log(player.leftBlock)
                                        if (player.leftBlock < -1) {
                                            player.vel.x = -1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                }
                                if (current_X_Vel < 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel--;
                                } else if (current_X_Vel > 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel++;
                                }
                            }
                            if (first_X_Vel === current_X_Vel) {
                                if (player.pos.x + player.vel.x >= blockX &&
                                    player.pos.x + player.vel.x <= blockX &&
                                    player.pos.y >= blockY &&
                                    player.pos.y <= blockY) {
                                    player.vel.x = 0;
                                    if (first_X_Vel >= 0 && player.rightBlock >= first_X_Vel) {
                                        player.rightBlock = first_X_Vel;
                                        // console.log("rightBlock")
                                        // console.log(player.rightBlock)
                                        if (player.rightBlock > 1) {
                                            player.vel.x = 1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                    if (first_X_Vel <= 0 && player.leftBlock <= first_X_Vel) {
                                        player.leftBlock = first_X_Vel;
                                        // console.log("leftBlock")
                                        // console.log(player.leftBlock)
                                        if (player.leftBlock < -1) {
                                            player.vel.x = -1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                }
                            }
                            while (first_Y_Vel < current_Y_Vel || first_Y_Vel > current_Y_Vel) {
                                if (player.pos.x >= blockX &&
                                    player.pos.x <= blockX &&
                                    player.pos.y + first_Y_Vel >= blockY &&
                                    player.pos.y + first_Y_Vel <= blockY) {
                                    player.vel.y = 0
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel >= 0 && player.downBlock >= first_Y_Vel) {
                                        player.downBlock = first_Y_Vel;
                                        // console.log("downBlock")
                                        // console.log(player.downBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel <= 0 && player.upBlock <= first_Y_Vel) {
                                        player.upBlock = first_Y_Vel;
                                        // console.log("upBlock")
                                        // console.log(player.upBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                                if (current_Y_Vel < 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel--;
                                } else if (current_Y_Vel > 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel++;
                                }
                            }
                            if (first_Y_Vel === current_Y_Vel) {
                                if (player.pos.x >= blockX &&
                                    player.pos.x <= blockX &&
                                    player.pos.y + first_Y_Vel >= blockY &&
                                    player.pos.y + first_Y_Vel <= blockY) {
                                    player.vel.y = 0
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel >= 0 && player.downBlock >= first_Y_Vel) {
                                        player.downBlock = first_Y_Vel;
                                        // console.log("downBlock")
                                        // console.log(player.downBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel <= 0 && player.upBlock <= first_Y_Vel) {
                                        player.upBlock = first_Y_Vel;
                                        // console.log("upBlock")
                                        // console.log(player.upBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                            }
                            while (first_X_Vel < current_X_Vel || first_X_Vel > current_X_Vel || first_Y_Vel < current_Y_Vel || first_Y_Vel > current_Y_Vel) {
                                if (player.pos.x + first_X_Vel >= blockX &&
                                    player.pos.x + first_X_Vel <= blockX &&
                                    player.pos.y + first_Y_Vel >= blockY &&
                                    player.pos.y + first_Y_Vel <= blockY) {
                                    player.vel.x = 0;
                                    player.vel.y = 0;
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel > 0 && player.downBlock > first_Y_Vel && first_X_Vel > 0 && player.rightBlock > first_X_Vel) {
                                        player.downRightBlock = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("downRightBlock")
                                        // console.log(player.downRightBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel > 0 && player.downBlock > first_Y_Vel && first_X_Vel < 0 && player.leftBlock < first_X_Vel) {
                                        player.downLeft = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("downLeft")
                                        // console.log(player.downLeft)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel < 0 && player.upBlock < first_Y_Vel && first_X_Vel > 0 && player.rightBlock > first_X_Vel) {
                                        player.upRight = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("upRight")
                                        // console.log(player.upRight)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel < 0 && player.upBlock < first_Y_Vel && first_X_Vel < 0 && player.leftBlock < first_X_Vel) {
                                        player.upLeftBlock = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("upLeftBlock")
                                        // console.log(player.upLeftBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                                if (current_X_Vel < 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel--;
                                } else if (current_X_Vel > 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel++;
                                }
                                if (current_Y_Vel < 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel--;
                                } else if (current_Y_Vel > 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel++;
                                }
                            }

                            if (first_Y_Vel === current_Y_Vel && first_X_Vel === current_X_Vel) {
                                if (player.pos.x + player.vel.x >= blockX &&
                                    player.pos.x + player.vel.x <= blockX &&
                                    player.pos.y + player.vel.y >= blockY &&
                                    player.pos.y + player.vel.y <= blockY) {
                                    player.vel.x = 0;
                                    player.vel.y = 0;
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel > 0 && player.downBlock > first_Y_Vel && first_X_Vel > 0 && player.rightBlock > first_X_Vel) {
                                        player.downRightBlock = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("downRightBlock 1")
                                        // console.log(player.downRightBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel > 0 && player.downBlock > first_Y_Vel && first_X_Vel < 0 && player.leftBlock < first_X_Vel) {
                                        player.downLeft = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("downLeft 1")
                                        // console.log(player.downLeft)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel < 0 && player.upBlock < first_Y_Vel && first_X_Vel > 0 && player.rightBlock > first_X_Vel) {
                                        player.upRight = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("upRight 1")
                                        // console.log(player.upRight)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel < 0 && player.upBlock < first_Y_Vel && first_X_Vel < 0 && player.leftBlock < first_X_Vel) {
                                        player.upLeftBlock = {
                                            "x": first_X_Vel,
                                            "y": first_Y_Vel
                                        };
                                        // console.log("upLeftBlock 1")
                                        // console.log(player.upLeftBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                            }
                        } else {
                            while (first_X_Vel < current_X_Vel || first_X_Vel > current_X_Vel) {
                                if (player.pos.x + first_X_Vel >= blockX &&
                                    player.pos.x + first_X_Vel <= blockX &&
                                    player.pos.y >= blockY &&
                                    player.pos.y <= blockY) {
                                    player.vel.x = 0;
                                    if (first_X_Vel >= 0 && player.rightBlock >= first_X_Vel) {
                                        player.rightBlock = first_X_Vel;
                                        // console.log("rightBlock")
                                        // console.log(player.rightBlock)
                                        if (player.rightBlock > 1) {
                                            player.vel.x = 1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                    if (first_X_Vel <= 0 && player.leftBlock <= first_X_Vel) {
                                        player.leftBlock = first_X_Vel;
                                        // console.log("leftBlock")
                                        // console.log(player.leftBlock)
                                        if (player.leftBlock < -1) {
                                            player.vel.x = -1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                }
                                if (current_X_Vel < 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel--;
                                } else if (current_X_Vel > 0 && first_X_Vel != current_X_Vel) {
                                    first_X_Vel++;
                                }
                            }
                            if (first_X_Vel === current_X_Vel) {
                                if (player.pos.x + player.vel.x >= blockX &&
                                    player.pos.x + player.vel.x <= blockX &&
                                    player.pos.y >= blockY &&
                                    player.pos.y <= blockY) {
                                    player.vel.x = 0;
                                    if (first_X_Vel >= 0 && player.rightBlock >= first_X_Vel) {
                                        player.rightBlock = first_X_Vel;
                                        // console.log("rightBlock")
                                        // console.log(player.rightBlock)
                                        if (player.rightBlock > 1) {
                                            player.vel.x = 1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                    if (first_X_Vel <= 0 && player.leftBlock <= first_X_Vel) {
                                        player.leftBlock = first_X_Vel;
                                        // console.log("leftBlock")
                                        // console.log(player.leftBlock)
                                        if (player.leftBlock < -1) {
                                            player.vel.x = -1;
                                        } else {
                                            player.vel.x = 0
                                        }
                                    }
                                }
                            }
                            while (first_Y_Vel < current_Y_Vel || first_Y_Vel > current_Y_Vel) {
                                if (player.pos.x >= blockX &&
                                    player.pos.x <= blockX &&
                                    player.pos.y + first_Y_Vel >= blockY &&
                                    player.pos.y + first_Y_Vel <= blockY) {
                                    player.vel.y = 0
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel >= 0 && player.downBlock >= first_Y_Vel) {
                                        player.downBlock = first_Y_Vel;
                                        // console.log("downBlock")
                                        // console.log(player.downBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel <= 0 && player.upBlock <= first_Y_Vel) {
                                        player.upBlock = first_Y_Vel;
                                        // console.log("upBlock")
                                        // console.log(player.upBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                                if (current_Y_Vel < 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel--;
                                } else if (current_Y_Vel > 0 && first_Y_Vel != current_Y_Vel) {
                                    first_Y_Vel++;
                                }
                            }
                            if (first_Y_Vel === current_Y_Vel) {
                                if (player.pos.x >= blockX &&
                                    player.pos.x <= blockX &&
                                    player.pos.y + first_Y_Vel >= blockY &&
                                    player.pos.y + first_Y_Vel <= blockY) {
                                    player.vel.y = 0
                                    if (first_Y_Vel === 1) {
                                        player.flying = 1;
                                    }
                                    if (first_Y_Vel >= 0 && player.downBlock >= first_Y_Vel) {
                                        player.downBlock = first_Y_Vel;
                                        // console.log("downBlock")
                                        // console.log(player.downBlock)
                                        if (player.downBlock > 1) {
                                            player.vel.y = 1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                    if (first_Y_Vel <= 0 && player.upBlock <= first_Y_Vel) {
                                        player.upBlock = first_Y_Vel;
                                        // console.log("upBlock")
                                        // console.log(player.upBlock)
                                        if (player.upBlock < -1) {
                                            player.vel.y = -1;
                                        } else {
                                            player.vel.y = 0
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            })
        }
        return (player)
    } else if (mode === "liquids") {
        return (player)
    } else {
        // console.log("We do not have this mode! Error at checkCollision")
    }
}

function creaseObject(player, item, countName, howMuch, byWhat) {
    // playerList["player" + i].itemList["food"]["foodItem"] = { "count": 1,
    let value1, value2;
    if (player.itemList !== null && typeof player.itemList == "object") {
        // there is itemList, now iterating over those items
        Object.entries(player.itemList).forEach(([key, value]) => {
            value1 = key;
            // got the item type now let's check if it has items in it
            if (value !== null && typeof value == "object") {
                Object.entries(value).forEach(([key, value]) => {
                    value2 = key;
                    // got an item, checking if it has the same name
                    if (key !== null && key == item) {
                        if (value !== null && typeof value == "object") {
                            // got the items inside the item
                            Object.entries(value).forEach(([key, value]) => {
                                value3 = key;
                                // checking if it has the same countName and if it does it should return
                                if (key === countName) {
                                    if (byWhat === "+") {
                                        player.itemList[value1][value2][value3] += howMuch;
                                        return player;
                                    } else if (byWhat === "-") {
                                        player.itemList[value1][value2][value3] -= howMuch;
                                        return player;
                                    } else if (byWhat === "*") {
                                        player.itemList[value1][value2][value3] *= howMuch;
                                        return player;
                                    } else if (byWhat === "**") {
                                        player.itemList[value1][value2][value3] **= howMuch;
                                        return player;
                                    } else if (byWhat === "/") {
                                        player.itemList[value1][value2][value3] /= howMuch;
                                        return player;
                                    } else if (byWhat === "%") {
                                        player.itemList[value1][value2][value3] %= howMuch;
                                        return player;
                                    } else if (byWhat === "++") {
                                        player.itemList[value1][value2][value3]++;
                                        return player;
                                    } else if (byWhat === "--") {
                                        player.itemList[value1][value2][value3]--;
                                        return player;
                                    } else {
                                        // console.log("Uhm, called creaseObject but nothing happened because of byWhat")
                                        return player;
                                    }
                                }
                            })
                        }
                    }
                });
            }
        });
    } else {
        // jsonObj is a number or string
        // console.log("Uhm, the player doesnt have an itemlist")
        return player;
    }
    return player;
}




function randomFood(state) {
    // Food spawns above 128, 129, 130 etc y positions (spawns at the upper half of the game)
    food = {
        x: Math.floor(Math.random() * (GRID_SIZE - 175)),
        y: Math.floor(Math.random() * (GRID_SIZE - 175)),
    }
    state.food = food;
}

function getUpdatedVelocity(keyCode) {
    switch (keyCode) {
        case 37: { // Left Arrow moves left
            return {
                x: -1,
                y: 0
            };
        }
        case 39: { // Right Arrow moves right
            return {
                x: 1,
                y: 0
            };
        }
        case 40: { // Down Arrow moves down
            return {
                x: 0,
                y: 1
            };
        }
        case 65: { // A key moves left
            return {
                x: -1,
                y: 0
            };
        }
        case 97: { // a key moves left
            return {
                x: -1,
                y: 0
            };
        }
        case 68: { // D key moves right
            return {
                x: 1,
                y: 0
            };
        }
        case 100: { // d key moves right
            return {
                x: 1,
                y: 0
            };
        }
        case 83: { // S key moves down
            return {
                x: 0,
                y: 1
            };
        }
        case 115: { // s key moves down
            return {
                x: 0,
                y: 1
            };
        }
        case 38: { // Up Arrow moves up
            return {
                x: 0,
                y: -1
            };
        }
        case 87: { // W key moves up
            return {
                x: 0,
                y: -1
            };
        }
        case 119: { // w key moves up
            return {
                x: 0,
                y: -1
            };
        }
    }
}