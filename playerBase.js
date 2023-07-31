module.exports = {
  basePlayer,
}

function basePlayer(playersNumberWithSockets) {
  const base = {
      number: playersNumberWithSockets,
      pos: {
          x: 10,
          y: 10,
      },
      vel: {
          x: 0,
          y: 0,
      },
      downRightBlock: {},
      downLeft: {},
      upRight: {},
      upLeftBlock: {},
      downBlock: 420,
      upBlock: -420,
      rightBlock: 420,
      leftBlock: -420,
      flying: 0,
      doubleJump: 0,
      jetFlying: 0,
      limitedJetFlying: 0,
      itemList: {
          "pet": {
              "thePetHugeOne": {
                  "count": 1,
                  "wearing": false,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 9,
                              "y": 10,
                          },
                          "A255255000100": {
                              "x": 10,
                              "y": 10,
                          },
                      },
                  }
              },
          },
          "petLeash": {
              "theLeash": {
                  "count": 1,
                  "wearing": true,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 10,
                              "y": 9,
                          },
                      },
                  }
              },
          },
          "gloves": {
              "theGloves": {
                  "count": 1,
                  "wearing": true,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 10,
                              "y": 11,
                          },
                      },
                  }
              }
          },
          "weapon": {
              "theWeapon1": {
                  "count": 1,
                  "wearing": true,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 9,
                              "y": 10,
                          },
                          "A255255000100": {
                              "x": 10,
                              "y": 10,
                          },
                      },
                  }
              },
              "theWeapon2": {
                  "count": 1,
                  "wearing": false,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 10,
                              "y": 9,
                          },
                      },
                  }
              },
              "theWeapon3": {
                  "count": 1,
                  "wearing": false,
                  "animationFrames": {
                      animationFrame1: {
                          "A255000000100": {
                              "x": 10,
                              "y": 11,
                          },
                      },
                  }
              }
          },
      }
  };
  return base;
}