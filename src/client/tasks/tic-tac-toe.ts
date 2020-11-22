/* 
TODO: 
    - Main features:
        + Win shapes (instead of straght line)
    - AI:
        + Customize intelligent level
    - Fix:
        + Size point not update when change size board
        + Turn is different in different sockets in new game
    - Dat: 
        + Add highlight options (OutlinePass)
        + Lock some Dat options when start game to prevent cheating (pointsToScore, sizeboard)
    - Appearance:
        + Customize point geometry (cube...)
        + Add cool effects/animations for game events (start, reset)
        + Enhance bars (with MeshLine...)
    - Extra (optional):
        + Room for Remote Multi-player Mode
        + Enable/disable to destroy claimed points for Destroy Mode
        + Game reseting animation (y scaling)
        + Dead point color, visible [socket]
        + Sounds
        + VR support
        + Mobile responsive
        + n-dimentional board (n>=4)
        + Different tic tac toe variants
        + Enable/disable inner win (a claimed win combination with 2 heads blocked)
*/

import { GUI, GUIController } from '/jsm/libs/dat.gui.module.js'
import * as THREE from '/build/three.module.js'
import { socket, socketEnabled, outlinePass, raycaster, mouse, camera, transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string = 'arid'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

enum Event {
    SYNC_SCENE_DATA = "tictactoe-syncSceneData",
    SYNC_AI = "tictactoe-syncAi",
    SYNC_DEAD_POINTS_AND_TO_DESTROY = "tictactoe-syncDeadPointsAndToDestroy",
    PLAYER_MOVE = "tictactoe-playerMove",
    UPDATE_PLAYER = "tictactoe-updatePlayer"
}

enum BlindMode { DISABLE, ONE_PLAYER, AI_PLAYERS, NON_AI_PLAYERS, ALL_PLAYERS }

type SceneData = {
    eventName: string, // to distinguish SceneData among different tasks
    playerNumber: number,
    dimension: number,
    boardSize: number,
    pointsToScore: number,
    ai: {
        delay: number,
        defensive: number,
    },
    blind: {
        mode: BlindMode,
        intervalReveal: number, // reveal color for every (interval) ms
        revealDuration: number, // must < intervalReveal
    },
    countdown: {
        enable: boolean,
        time: number,
    },
    multiScore: {
        highestScoreToWin: boolean,
        scoresToWin: number,
        overlapping: boolean,
    },
    destroy: {
        amount: number,
        frequency: number,
    },
    deadPoint: {
        amount: number,
        visible: boolean,
        color: THREE.Color
    },
    point: {
        wireframe: boolean,
        radius: number,
        metalness: number,
        roughness: number,
        opacity: number,
        widthSegments: number,
        heightSegments: number,
    },
    bar: {
        visible: boolean,
        color: THREE.Color,
        linewidth: number,
        opacity: number,
    }
}

function instanceOfSceneData(data: any): boolean {
    return data.eventName === Event.SYNC_SCENE_DATA;
}

let sceneData: SceneData = {
    eventName: Event.SYNC_SCENE_DATA,
    playerNumber: 2,
    dimension: 3,
    boardSize: 8,
    pointsToScore: 5,
    ai: {
        delay: 1500,
        defensive: 3,
    },
    blind: {
        mode: BlindMode.DISABLE,
        intervalReveal: 4,
        revealDuration: 0.1,
    },
    countdown: {
        enable: false,
        time: 30,
    },
    multiScore: {
        highestScoreToWin: false, // play until all points are claim, winner has the highest scores
        scoresToWin: 1,
        overlapping: false, // different combination can share the same points
    },
    destroy: {
        amount: 0,
        frequency: 1,
    },
    deadPoint: {
        amount: 16,
        visible: true,
        color: new THREE.Color(0x000000)
    },
    point: {
        wireframe: false,
        radius: 1,
        metalness: 0.4,
        roughness: 1,
        opacity: 1,
        widthSegments: 25,
        heightSegments: 1,
    },
    bar: {
        visible: true,
        color: new THREE.Color(0xffffff),
        linewidth: 3,
        opacity: 0.5,
    }
}

/* DOM */
const instructionElement = document.querySelector("#instruction")! as HTMLElement
const countdownElement = document.querySelector("#tictactoe-countdown")! as HTMLElement

type Player = {
    id: number,
    isAi: boolean,
    color: THREE.Color,
    score: number,
}
let players: Player[] = []

enum GameMode { LOCAL_MULTIPLAYER, REMOTE_MULTIPLAYER }
let gameMode: GameMode = GameMode.REMOTE_MULTIPLAYER

const DEAD: number = -3 // points which could not be claimed
const CLAIMED: number = -2
const UNCLAIMED: number = -1
let currentTurn: number = 0
let aiPreferredMoves: number[] // array of point indexes for aiMove()
var gameOver: boolean = false;
let destroyCount: number = 0 // keep track number of points are destroyed
let frequencyDestroyCount: number = 0 // count each turn until start destroying
/* 
    Conbinations when win point = board size
    This set already includes all lines parallel to x/y/z axis, xy/xz/yz face and 4 diagonal lines
    When update win point < board size, just need to generate the rest (diagonal) lines 
*/
let fullWinCombinations: number[][] = []
let winCombinations: number[][] = []
let claimedWinCombinations: number[][] = []
let testCombination: number[] = []

let bars: THREE.LineSegments
let pointGeometry: THREE.SphereGeometry
let points: THREE.Mesh[] = [];
let highlightBorders: THREE.Mesh[] = []
let claimedPointIds: number[] = []
let deadPointIds: number[] = []
let toDestroyIds: number[] = []
let lastClaimedPoint: THREE.Mesh

export function init() {
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    instructionElement.innerHTML = "Right click to select"

    setupSocket()
    addEvents()
    initGame()
    createLights()
    setupControls()
    createDatGUI()

    // sample setup for n-multi-player
    updatePlayerNumber(sceneData.playerNumber)
    players[0].isAi = false
    players[1].isAi = true

    // kick off first player if AI
    if (players[0].isAi) {
        kickOffAiMove()
    }
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

function initGame() {
    claimedPointIds = []
    destroyCount = 0
    frequencyDestroyCount = 0
    resetHighlightBorders()
    createPoints()
    createBars()
    generateDeadPointAndToDestroyIds()
    createDeadPoints()
    generateFullWinCombinations() // invoke when update board size
    generateWinCombinations() // invoke when update board size or win point
    generateAiPreferredMoves()

    if (sceneData.countdown.enable) {
        clearInterval(countDownLoop)
        activateCountDown()
    }

    if (gameMode == GameMode.REMOTE_MULTIPLAYER) {
        socket.emit("broadcast", { eventName: Event.SYNC_AI, aiPreferredMoves: aiPreferredMoves })
        socket.emit("broadcast", { eventName: Event.SYNC_DEAD_POINTS_AND_TO_DESTROY, deadPointIds: deadPointIds, toDestroyIds: toDestroyIds })
    }
}

window.onload = () => {
    if (sceneData.countdown.enable) activateCountDown()
}

let countDownLoop: NodeJS.Timeout
let currentTurnCountDown: number
function activateCountDown() {
    if (players.length == 0) return

    countdownElement.style.display = "block"
    countdownElement.style.color = "#" + players[currentTurn].color.getHexString()

    currentTurnCountDown = sceneData.countdown.time
    countDownLoop = setInterval(() => {
        countdownElement.innerHTML = currentTurnCountDown.toString()
        // console.log(`Count down: ${currentTurnCountDown}`)
        currentTurnCountDown--

        if (currentTurnCountDown == sceneData.countdown.time - 1)
            countdownElement.style.color = "#" + players[currentTurn].color.getHexString()

        if (currentTurnCountDown == 0)
            nextTurn()

    }, 1000)
}

function clearDeadPoints() {
    deadPointIds.forEach(id => {
        points[id].userData.claim = UNCLAIMED;
        (points[id].material as any).color.set(0xffffff);
        points[id].visible = sceneData.deadPoint.visible
    })
}

// mark points as DEAD when deadPointIds is availble
function createDeadPoints() {
    deadPointIds.forEach(id => { destroyPoint(id) })
}

function destroyPoint(id: number) {
    points[id].userData.claim = DEAD;
    (points[id].material as any).color.set(sceneData.deadPoint.color);
    points[id].visible = sceneData.deadPoint.visible
}

function generateDeadPointAndToDestroyIds() {
    // reset 
    deadPointIds = []
    toDestroyIds = generateRandomIds()

    while (deadPointIds.length < sceneData.deadPoint.amount) {
        const random = Math.floor(Math.random() * Math.pow(sceneData.boardSize, sceneData.dimension));
        if (deadPointIds.indexOf(random) === -1) {
            deadPointIds.push(random);
            // remove id of already-dead point from toDestroy
            toDestroyIds.splice(random, 1)
        }
    }

    console.log("Generating dead point ids...")
    console.log(deadPointIds);
    console.log("Generating to destroy ids...")
    console.log(toDestroyIds)
}

function generateFullWinCombinations() {
    const n = sceneData.boardSize
    // reset combinations
    fullWinCombinations = []
    let winCombination: number[] = []

    // lines parallel to z axis (common fomular for both 2D and 3D)
    for (let i = 0; i <= Math.pow(n, sceneData.dimension) - n; i += n) {
        const winCombination: number[] = []
        for (let j = i; j < i + n; j++) {
            winCombination.push(j)
        }
        fullWinCombinations.push(winCombination)
    }

    if (sceneData.dimension == 2) {
        // lines parallel to y axis
        for (let i = 0; i < n; i++) {
            const winCombination: number[] = []
            for (let j = 0; j < n; j++) {
                winCombination.push(i + n * j)
            }
            fullWinCombinations.push(winCombination)
        }

        // 2 diagonal lines
        winCombination = []
        for (let i = 0; i <= Math.pow(n, 2); i += n + 1) {
            winCombination.push(i)
        }
        fullWinCombinations.push(winCombination)

        winCombination = []
        for (let i = n - 1; i <= Math.pow(n, 2) - n; i += n - 1) {
            winCombination.push(i)
        }
        fullWinCombinations.push(winCombination)

        return
    }

    // n^2 lines parallel to x axis
    for (let i = 0; i < Math.pow(n, 2); i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + Math.pow(n, 2) * j)
        }
        fullWinCombinations.push(winCombination)
    }

    // n^2 lines parallel to y axis
    for (let a = 0; a <= n - 1; a++) {
        for (let i = Math.pow(n, 2) * a; i < Math.pow(n, 2) * a + n; i++) {
            const winCombination: number[] = []
            for (let j = 0; j < n; j++) {
                winCombination.push(i + j * n)
            }
            // console.log(winCombination)
            fullWinCombinations.push(winCombination)
        }
    }

    // diagonal lines parallel to xy face
    for (let i = 0; i < n; i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) + n) * j)
        }
        fullWinCombinations.push(winCombination)
    }
    for (let i = Math.pow(n, 2) - n; i < Math.pow(n, 2); i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) - n) * j)
        }
        fullWinCombinations.push(winCombination)
    }

    // diagonal lines parallel to xz face
    for (let i = 0; i <= Math.pow(n, 2) - n; i += n) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) + 1) * j)
        }
        fullWinCombinations.push(winCombination)
    }
    for (let i = n - 1; i <= Math.pow(n, 2) - 1; i += n) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) - 1) * j)
        }
        fullWinCombinations.push(winCombination)
    }

    // diagonal lines parallel to yz face
    for (let i = 0; i <= Math.pow(n, 2) * (n - 1); i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n + 1) * j)
        }
        fullWinCombinations.push(winCombination)
    }
    for (let i = n - 1; i <= Math.pow(n, 2) * (n - 1) + n - 1; i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n - 1) * j)
        }
        fullWinCombinations.push(winCombination)
    }

    // 4 diagonal lines across the origin
    for (let i = 0; i < n; i++) {
        winCombination.push(i + (Math.pow(n, 2) + n) * i)
    }
    fullWinCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(n - 1 + (Math.pow(n, 2) + n - 1) * i)
    }
    fullWinCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(Math.pow(n, 2) - n + (Math.pow(n, 2) - n + 1) * i)
    }
    fullWinCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(Math.pow(n, 2) - 1 + (Math.pow(n, 2) - n - 1) * i)
    }
    fullWinCombinations.push(winCombination)

    console.log(`Full win combinations:`)
    console.log(fullWinCombinations)
}

function generateWinCombinations() {
    testCombination = []
    points.forEach(point => (point.material as any).emissive.setHex(0x000000))
    winCombinations = fullWinCombinations
    const n = sceneData.boardSize
    const m = sceneData.pointsToScore
    const d = sceneData.dimension
    // when board size = win point, fullWinCombinations is also winCombinations
    if (m == n) return

    let winCombination1: number[] = []
    let winCombination2: number[] = []
    let winCombination3: number[] = []
    let winCombination4: number[] = []

    if (d == 2) {
        for (let dif = 1; dif <= n - m; dif++) {
            winCombination1 = []
            winCombination2 = []
            winCombination3 = []
            winCombination4 = []
            for (let i = 0; i < n - dif; i++) {
                // diagonal lines parallel to (y=+z) line
                winCombination1.push(dif + i * (n + 1))
                winCombination2.push(dif * n + i * (n + 1))

                // diagonal lines parallel to (y=-z) line
                winCombination3.push((n - 1) - dif + i * (n - 1))
                winCombination4.push(dif * n + (n - 1) + i * (n - 1))
            }

            winCombinations.push(winCombination1)
            winCombinations.push(winCombination2)
            winCombinations.push(winCombination3)
            winCombinations.push(winCombination4)
        }
    }

    if (d == 3) {
        for (let dif = 1; dif <= n - m; dif++) {
            // 2D => 1 face | 3D => n faces
            // TODO: combine this set of faces with 2D

            // diagonal lines parallel to yz face 
            for (let face = 0; face < n; face++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (y=+z)
                    winCombination1.push(dif + Math.pow(n, 2) * face + i * (n + 1))
                    winCombination2.push(dif * n + Math.pow(n, 2) * face + i * (n + 1))

                    // (y=-z)
                    winCombination3.push((n - 1) - dif + Math.pow(n, 2) * face + i * (n - 1))
                    winCombination4.push(dif * n + (n - 1) + Math.pow(n, 2) * face + i * (n - 1))
                }
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }

            // dif:dface 1:2 2:3
            // diagonal lines parallel to diagonal yz face 
            for (let dface = 0; dface < dif + 1; dface++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (y=+z)
                    winCombination1.push(dif + Math.pow(n, 2) * dface + i * (n + 1 + Math.pow(n, 2)))
                    winCombination2.push(dif * n + Math.pow(n, 2) * dface + i * (n + 1 + Math.pow(n, 2)))

                    // (y=-z)
                    winCombination3.push((n - 1) - dif + Math.pow(n, 2) * dface + i * (n - 1 + Math.pow(n, 2)))
                    winCombination4.push(dif * n + (n - 1) + Math.pow(n, 2) * dface + i * (n - 1 + Math.pow(n, 2)))
                }
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }

            // diagonal lines parallel to xy face 
            for (let face = 0; face < n; face++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (x=+y)
                    winCombination1.push(dif * Math.pow(n, 2) + face + (Math.pow(n, 2) + n) * i)
                    winCombination2.push(dif * n + face + (Math.pow(n, 2) + n) * i)

                    // (x=-y)
                    winCombination3.push((n - 1 - dif) * Math.pow(n, 2) + face - (Math.pow(n, 2) - n) * i)
                    winCombination4.push(dif * n + (n - 1) * Math.pow(n, 2) + face - (Math.pow(n, 2) - n) * i)
                }
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }

            // diagonal lines parallel to diagonal xy face 
            for (let dface = 0; dface < dif + 1; dface++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (x=+y)
                    winCombination1.push(dif * Math.pow(n, 2) + dface + (Math.pow(n, 2) + n + 1) * i)
                    winCombination2.push(dif * n + dface + (Math.pow(n, 2) + n + 1) * i)

                    // (x=-y)
                    winCombination3.push((n - 1 - dif) * Math.pow(n, 2) + dface - (Math.pow(n, 2) - n + 1) * i)
                    winCombination4.push(dif * n + (n - 1) * Math.pow(n, 2) + dface - (Math.pow(n, 2) - n + 1) * i)
                }

                // console.log(testCombination)
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }

            // diagonal lines parallel to xz face 
            for (let face = 0; face < n; face++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (x=+z)
                    winCombination1.push(dif + face * n + (Math.pow(n, 2) + 1) * i)
                    winCombination2.push(dif * Math.pow(n, 2) + face * n + (Math.pow(n, 2) + 1) * i)

                    // (x=-z)
                    winCombination3.push((n - 1 - dif) + face * n + (Math.pow(n, 2) - 1) * i)
                    winCombination4.push(dif * Math.pow(n, 2) + (n - 1) + face * n + (Math.pow(n, 2) - 1) * i)
                }
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }

            // diagonal lines parallel to diagonal xz face 
            for (let dface = 0; dface < dif + 1; dface++) {
                winCombination1 = []
                winCombination2 = []
                winCombination3 = []
                winCombination4 = []
                for (let i = 0; i < n - dif; i++) {
                    // (x=+z)
                    winCombination1.push(dif + dface * n + (Math.pow(n, 2) + 1 + n) * i)
                    winCombination2.push(dif * Math.pow(n, 2) + dface * n + (Math.pow(n, 2) + 1 + n) * i)

                    // (x=-z)
                    winCombination3.push((n - 1 - dif) + dface * n + (Math.pow(n, 2) - 1 + n) * i)
                    winCombination4.push(dif * Math.pow(n, 2) + (n - 1) + dface * n + (Math.pow(n, 2) - 1 + n) * i)
                }
                winCombinations.push(winCombination1)
                winCombinations.push(winCombination2)
                winCombinations.push(winCombination3)
                winCombinations.push(winCombination4)
            }
        }
    }

    winCombinations = extractSubCombinations(winCombinations, m)

    // debugging
    console.log("Win combinations:")
    console.log(winCombinations)
    // testCombination.forEach(index => (points[index].material as any).emissive.setHex(0xff0000))
    // winCombinations.forEach(winCombination => {
    //     winCombination.forEach(index => (points[index].material as any).emissive.setHex(0xff0000))
    // })
}

// get all the subsets of m-adjacent elements
// original combinations could have different array size  >= m
function extractSubCombinations(originalCombinations: number[][], pointsToScore: number): number[][] {
    const newCombinations: number[][] = []
    const m: number = pointsToScore
    originalCombinations.forEach(winCombination => {
        const n = winCombination.length
        if (m < n) {
            for (let i = 0; i <= n - m; i++) {
                const subCombination = winCombination.slice(i, i + m)
                newCombinations.push(subCombination)
            }
        } else {
            newCombinations.push(winCombination)
        }
    }
    )

    return newCombinations
}

/* SOCKET */
// TODO: sync dead points params
function setupSocket() {
    // TODO: create type for this data
    socket.on(Event.PLAYER_MOVE, (data: any) => {
        if (gameMode != GameMode.REMOTE_MULTIPLAYER) return
        // (points[data.id].material as any).color.set(players[currentTurn].color);
        updateClaimedPoint(points[data.id])
        nextTurn();
    })

    socket.on(Event.SYNC_AI, (data: any) => {
        if (gameMode != GameMode.REMOTE_MULTIPLAYER) return
        aiPreferredMoves = data.aiPreferredMoves

        console.log(`Sync AI:`)
        console.log(data.aiPreferredMoves)
    })

    socket.on(Event.SYNC_DEAD_POINTS_AND_TO_DESTROY, (data: any) => {
        if (gameMode != GameMode.REMOTE_MULTIPLAYER) return
        resetGame()
        destroyCount = 0
        currentTurn = 0
        // clear current dead points of current socket
        clearDeadPoints()
        // sync and generate dead points from other sockets
        deadPointIds = data.deadPointIds
        createDeadPoints()
        // update controller
        sceneData.deadPoint.amount = deadPointIds.length
        deadPointNumberController.updateDisplay()

        console.log(`Sync dead point ids:`)
        console.log(data.deadPointIds)

        toDestroyIds = data.toDestroyIds
        console.log(`Sync to destroy ids:`)
        console.log(data.toDestroyIds)
    })

    socket.on(Event.UPDATE_PLAYER, (data: any) => {
        players[data.id].isAi = data.isAi
        // kick off current player to move when being changed to AI
        if (players[data.id].isAi && players[data.id].id == currentTurn) kickOffAiMove()
    })

    // when receive update from other sockets
    socket.on(Event.SYNC_SCENE_DATA, (newSceneData: SceneData) => {
        // only process SceneData of this task
        if (!instanceOfSceneData(newSceneData)) { return } else { newSceneData = newSceneData as SceneData }
        if (!socketEnabled) return

        // changes not requiring doing stuffs
        copySceneData(sceneData, newSceneData)

        // changes requiring doing stuffs
        if (sceneData.playerNumber != newSceneData.playerNumber) {
            sceneData.playerNumber = newSceneData.playerNumber
            updatePlayerNumber(sceneData.playerNumber)
            resetGame()
            currentTurn = 0
        }

        if (sceneData.dimension != newSceneData.dimension) {
            sceneData.dimension = newSceneData.dimension
            console.log(sceneData.dimension)
            initGame()
        }

        if (sceneData.pointsToScore != newSceneData.pointsToScore) {
            sceneData.pointsToScore = newSceneData.pointsToScore
            aiDefensiveController.setValue(3)
            aiDefensiveController.max(sceneData.pointsToScore - 1)
            generateWinCombinations()
        }

        if (sceneData.boardSize != newSceneData.boardSize) {
            sceneData.boardSize = newSceneData.boardSize
            sceneData.pointsToScore = newSceneData.boardSize

            initGame()
            return // update 1 change per time? 
        }

        if (sceneData.blind.mode != newSceneData.blind.mode) {
            console.log("Sync blind mode...")
            sceneData.blind.mode = newSceneData.blind.mode
            updateBlindMode()
            return
        }

        if (sceneData.blind.intervalReveal != newSceneData.blind.intervalReveal) {
            console.log("Sync blind intervalReveal...")
            sceneData.blind.intervalReveal = newSceneData.blind.intervalReveal
            updateIntervalReveal()
            // return // no return to update revealDuration right after       
        }

        if (sceneData.blind.revealDuration != newSceneData.blind.revealDuration) {
            console.log("Sync blind revealDuration...")
            sceneData.blind.revealDuration = newSceneData.blind.revealDuration

            // limit revealDuration based on new intervalReveal
            blindRevealDurationController.max(sceneData.blind.intervalReveal - 1)
            sceneData.blind.revealDuration = Math.min(sceneData.blind.intervalReveal - 1, sceneData.blind.revealDuration)
            return
        }

        if (sceneData.countdown.enable != newSceneData.countdown.enable) {
            console.log("sync countdown")
            sceneData.countdown.enable = newSceneData.countdown.enable
            if (sceneData.countdown.enable)
                activateCountDown()
            else {
                countdownElement.style.display = "none"
                clearInterval(countDownLoop)
            }
            return
        }

        if (sceneData.countdown.time != newSceneData.countdown.time) {
            sceneData.countdown.time = newSceneData.countdown.time
            if (sceneData.countdown.enable) {
                clearInterval(countDownLoop)
                activateCountDown()
            }
            return
        }

        // TODO: refactor - combine multiple updates, performance?
        if (sceneData.point.wireframe != newSceneData.point.wireframe) {
            sceneData.point.wireframe = newSceneData.point.wireframe
            points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).wireframe = sceneData.point.wireframe)
            return
        }

        if (sceneData.point.radius != newSceneData.point.radius) {
            sceneData.point.radius = newSceneData.point.radius
            points.forEach(point => {
                point.scale.x = sceneData.point.radius
                point.scale.y = sceneData.point.radius
                point.scale.z = sceneData.point.radius
                // updatePointsPositions()
            })
            return
        }

        if (sceneData.point.roughness != newSceneData.point.roughness) {
            sceneData.point.roughness = newSceneData.point.roughness
            points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).roughness = sceneData.point.roughness)
            return
        }

        if (sceneData.point.metalness != newSceneData.point.metalness) {
            sceneData.point.metalness = newSceneData.point.metalness
            points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).metalness = sceneData.point.metalness)
            return
        }

        if (sceneData.point.opacity != newSceneData.point.opacity) {
            sceneData.point.opacity = newSceneData.point.opacity
            points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).opacity = sceneData.point.opacity)
            return
        }

        if (sceneData.point.widthSegments != newSceneData.point.widthSegments) {
            sceneData.point.widthSegments = newSceneData.point.widthSegments
            points.forEach(point => {
                point.geometry.dispose()
                point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.widthSegments, sceneData.point.heightSegments)
            })
            return
        }

        if (sceneData.point.heightSegments != newSceneData.point.heightSegments) {
            sceneData.point.heightSegments = newSceneData.point.heightSegments
            points.forEach(point => {
                point.geometry.dispose()
                point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.widthSegments, sceneData.point.heightSegments)
            })
            return
        }

        if (sceneData.bar.opacity != newSceneData.bar.opacity) {
            sceneData.bar.opacity = newSceneData.bar.opacity;
            (bars.material as THREE.LineBasicMaterial).opacity = sceneData.bar.opacity
            return
        }

        // if (sceneData.bar.visible != newSceneData.bar.visible) {
        //     sceneData.bar.visible = newSceneData.bar.visible
        //     bars.visible = sceneData.bar.visible
        //     console.log(sceneData.bar.visible)
        //     return
        // }

        // if (sceneData.bar.color != newSceneData.bar.color) {
        //     barColorController.setValue(sceneData.bar.color)
        //     sceneData.bar.color = newSceneData.bar.color
        //     return
        // }
        // changes not requiring doing stuffs

        // update Dat controllers (prefer: use listen())
        // controllers.forEach((controller: GUIController) => {
        //     controller.updateDisplay()
        // })

        console.log(`User ${socket.id} made a change`)
    })
}

function broadcast(data: any) {
    if (socketEnabled) {
        socket.emit("broadcast", data)
    }
}

// sync data that do not require doing other stuffs e.g. reset game... (controller onChange only for broadcasting)
function copySceneData(currentSceneData: SceneData, newSceneData: SceneData) {
    currentSceneData.ai.defensive = newSceneData.ai.defensive

    currentSceneData.multiScore.highestScoreToWin = newSceneData.multiScore.highestScoreToWin
    currentSceneData.multiScore.scoresToWin = newSceneData.multiScore.scoresToWin
    currentSceneData.multiScore.overlapping = newSceneData.multiScore.overlapping

    currentSceneData.destroy.amount = newSceneData.destroy.amount
    currentSceneData.destroy.frequency = newSceneData.destroy.frequency
}
/* END SOCKET */


/* DAT GUI */
let playerFolders: GUI[] = []
let playersFolder: GUI

// controllers need to be updated limitations when other params change
let blindModeController: GUIController
let blindRevealDurationController: GUIController
let deadPointNumberController: GUIController
let aiDefensiveController: GUIController
let barColorController: GUIController

let revealColorLoop: NodeJS.Timeout
const datOptions = {
    dimension: {
        "2D": 2,
        "3D": 3
    },
    gameMode: {
        "Local multi-player": GameMode.LOCAL_MULTIPLAYER,
        "Remote multi-player": GameMode.REMOTE_MULTIPLAYER,
    },
    blind: {
        mode: {
            "Disable": BlindMode.DISABLE,
            // TODO
            // "One player": BlindMode.ONE_PLAYER,
            // "AI players": BlindMode.AI_PLAYERS,
            // "Non-AI players": BlindMode.NON_AI_PLAYERS,
            "All players": BlindMode.ALL_PLAYERS
        },
    },
    color: {
        deadPoint: sceneData.deadPoint.color.getHex(),
        bar: sceneData.bar.color.getHex(),
    }
}

function createDatGUI() {
    const selectedGameMode = {
        name: GameMode.REMOTE_MULTIPLAYER,
    }

    gui = new GUI()
    gui.add(selectedGameMode, "name", datOptions.gameMode).name("Game mode").onChange(value => {
        gameMode = value

        if (gameMode == GameMode.REMOTE_MULTIPLAYER) {
            socket.emit("broadcast", { eventName: Event.SYNC_AI, aiPreferredMoves: aiPreferredMoves })
            socket.emit("broadcast", { eventName: Event.SYNC_DEAD_POINTS_AND_TO_DESTROY, deadPointIds: deadPointIds })
        }
    })

    gui.add(sceneData, "playerNumber", 2, 10, 1).name("Player number").listen().onFinishChange(value => {
        updatePlayerNumber(value)
        resetGame()
        broadcast(sceneData)
        currentTurn = 0
    })

    playersFolder = gui.addFolder("Players")
    playersFolder.open()

    const aisFolder: GUI = gui.addFolder("AI setting")
    aisFolder.add(sceneData.ai, "delay", 0, 2000, 100).name("delay (ms)")
    aiDefensiveController = aisFolder.add(sceneData.ai, "defensive", 1, sceneData.pointsToScore - 1, 1).listen().onFinishChange(value => {
        broadcast(sceneData)
    })

    gui.add(sceneData, "dimension", datOptions.dimension).name("Dimension").listen().onChange(value => {
        resetDeadPointsController()
        initGame()
        broadcast(sceneData)
    })

    let pointsToScoreController: GUIController

    gui.add(sceneData, "boardSize", 3, 30).step(1).name("Board size").listen().onFinishChange((value) => {
        // update pointsToScore
        sceneData.pointsToScore = value
        pointsToScoreController.max(value)

        resetDeadPointsController()
        initGame()
        broadcast(sceneData)
    })

    pointsToScoreController = gui.add(sceneData, "pointsToScore").min(3).max(sceneData.boardSize).step(1).name("Points to score").listen().onFinishChange(value => {
        aiDefensiveController.setValue(3)
        aiDefensiveController.max(sceneData.pointsToScore - 1)
        generateWinCombinations()
        broadcast(sceneData)
    })

    const multiScoreModeFolder = gui.addFolder("Multi-score mode")
    const maxScoresToWin: number = Math.pow(sceneData.boardSize, sceneData.dimension) / (sceneData.playerNumber * sceneData.pointsToScore)
    multiScoreModeFolder.add(sceneData.multiScore, "overlapping", false).listen().onChange(value => broadcast(sceneData))
    multiScoreModeFolder.add(sceneData.multiScore, "highestScoreToWin", false).name("highest score").listen().onChange(value => broadcast(sceneData))
    multiScoreModeFolder.add(sceneData.multiScore, "scoresToWin", 1, maxScoresToWin, 1).name("scores to win").listen().onChange(value => broadcast(sceneData))
    // multiScoreModeFolder.open()

    const countdownModeFolder = gui.addFolder("Countdown mode")
    countdownModeFolder.add(sceneData.countdown, "enable", true).listen().onChange(value => {
        if (value)
            activateCountDown()
        else {
            countdownElement.style.display = "none"
            clearInterval(countDownLoop)
        }

        broadcast(sceneData)
    })
    countdownModeFolder.add(sceneData.countdown, "time", 1, 60, 1).listen().onFinishChange(value => {
        if (sceneData.countdown.enable) {
            clearInterval(countDownLoop)
            activateCountDown()
        }

        broadcast(sceneData)
    })

    const blindModeFolder: GUI = gui.addFolder("Blind mode")
    blindModeController = blindModeFolder.add(sceneData.blind, "mode", datOptions.blind.mode).listen().onChange(value => {
        updateBlindMode()
        broadcast(sceneData)
    }).setValue(sceneData.blind.mode) // kick off init mode

    blindModeFolder.add(sceneData.blind, "intervalReveal", 1.1, 60, 0.1).name("interval reveal").listen().onFinishChange(value => {
        updateIntervalReveal()
        broadcast(sceneData)
    })

    blindRevealDurationController = blindModeFolder.add(sceneData.blind, "revealDuration").min(0.1).max(sceneData.blind.intervalReveal - 1).step(0.1).listen().name("reveal duration").onFinishChange(value => {
        broadcast(sceneData)
    })

    // blindModeFolder.open()

    // countdownModeFolder.open()

    const destroyModeFolder = gui.addFolder("Destroy mode")
    destroyModeFolder.add(sceneData.destroy, "amount", 0, 10, 1).listen().onFinishChange(value => {
        broadcast(sceneData)
    })
    destroyModeFolder.add(sceneData.destroy, "frequency", 1, 10, 1).listen().onFinishChange(value => {
        broadcast(sceneData)
    })
    // destroyModeFolder.open()

    const deadPointsFolder = gui.addFolder("Dead points")

    deadPointsFolder.add(sceneData.deadPoint, "visible", true).onChange(value => {
        deadPointIds.forEach(id => points[id].visible = sceneData.deadPoint.visible)
        for (let i = 0; i < destroyCount; i++) { // destroyed points
            points[toDestroyIds[i]].visible = sceneData.deadPoint.visible
        }
    })

    const deadPointMax = Math.floor(Math.pow(sceneData.boardSize, sceneData.dimension) / 5)
    deadPointNumberController = deadPointsFolder.add(sceneData.deadPoint, "amount").min(0).max(deadPointMax).step(1).listen().onFinishChange(value => {
        generateDeadPointAndToDestroyIds()
        resetGame()

        socket.emit("broadcast", { eventName: Event.SYNC_DEAD_POINTS_AND_TO_DESTROY, deadPointIds: deadPointIds })
    })

    deadPointsFolder.addColor(datOptions.color, 'deadPoint').name("color").onFinishChange(value => {
        sceneData.deadPoint.color = value;
        deadPointIds.forEach(id => ((points[id].material as THREE.MeshPhysicalMaterial).color as THREE.Color).setHex(Number(value.toString().replace('#', '0x'))))
        for (let i = 0; i < destroyCount; i++) { // destroyed points
            ((points[toDestroyIds[i]].material as THREE.MeshPhysicalMaterial).color as THREE.Color).setHex(Number(value.toString().replace('#', '0x')))
        }
    })
    // deadPointsFolder.open()

    const appearanceFolder: GUI = gui.addFolder("Appearance")

    const pointsFolder: GUI = appearanceFolder.addFolder("Points")
    pointsFolder.add(sceneData.point, "wireframe", false).listen().onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).wireframe = value)
        broadcast(sceneData)
    })
    pointsFolder.add(sceneData.point, "radius", 0.5, 1, 0.1).name("size").listen().onFinishChange(radius => {
        points.forEach(point => {
            point.scale.x = radius
            point.scale.y = radius
            point.scale.z = radius
            // updatePointsPositions()
        })
        broadcast(sceneData)
    })

    pointsFolder.add(sceneData.point, "roughness", 0, 1).listen().onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).roughness = value)
        broadcast(sceneData)
    })
    pointsFolder.add(sceneData.point, "metalness", 0, 1).listen().onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).metalness = value)
        broadcast(sceneData)
    })
    pointsFolder.add(sceneData.point, "opacity", 0.5, 1).listen().onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).opacity = value)
        broadcast(sceneData)
    })
    pointsFolder.add(sceneData.point, "widthSegments", 1, 25).listen().onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.widthSegments, sceneData.point.heightSegments)
        })
        broadcast(sceneData)
    })
    pointsFolder.add(sceneData.point, "heightSegments", 1, 25).listen().onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.radius, sceneData.point.radius)
        })
        broadcast(sceneData)
    })
    // pointsFolder.open()

    const barsFolder = appearanceFolder.addFolder("Bars")
    barsFolder.add(sceneData.bar, "visible", true).name("visible").listen().onChange(value => {
        bars.visible = value
    });
    barsFolder.add(sceneData.bar, "opacity", 0, 1).listen().onFinishChange(value => {
        (bars.material as THREE.LineBasicMaterial).opacity = value
        broadcast(sceneData)
    })
    barsFolder.add(sceneData.bar, "linewidth", 0, 10).name("thicc").listen().onFinishChange(value => {
        (bars.material as THREE.LineBasicMaterial).linewidth = value
        broadcast(sceneData)
    })

    barColorController = barsFolder.addColor(datOptions.color, 'bar').listen().onChange((value) => {
        sceneData.bar.color = value;
        ((bars.material as THREE.LineBasicMaterial).color as THREE.Color).setHex(Number(value.toString().replace('#', '0x')))
        broadcast(sceneData)
    });
    // barsFolder.open();

    // appearanceFolder.open()
}

function revealColor() {
    claimedPointIds.forEach(id => {
        players.forEach(player => {
            if (points[id].userData.claim == player.id)
                (points[id].material as any).color.set(player.color);
        });
    })
}
function hideColor() {
    claimedPointIds.forEach(id => {
        (points[id].material as any).color.setHex(0xffffff);
    })
}

function updateIntervalReveal() {
    console.log("Reset blind mode to apply change...")
    if (sceneData.blind.mode == BlindMode.ALL_PLAYERS) {
        clearInterval(revealColorLoop)
        // revealColor()
        blindModeController.setValue(blindModeController.getValue())
    }

    // limit revealDuration based on new intervalReveal
    blindRevealDurationController.max(sceneData.blind.intervalReveal - 1)
    sceneData.blind.revealDuration = Math.min(sceneData.blind.intervalReveal - 1, sceneData.blind.revealDuration)
}

function resetDeadPointsController() {
    sceneData.deadPoint.amount = 0
    const deadPointMax = Math.floor(Math.pow(sceneData.boardSize, sceneData.dimension) / 4)
    deadPointNumberController.max(deadPointMax)
}

function updateBlindMode() {
    if (sceneData.blind.mode == BlindMode.ALL_PLAYERS) {
        hideColor()
        revealColorLoop = setInterval(() => {
            revealColor()
            if (sceneData.blind.mode != BlindMode.ALL_PLAYERS) {
                clearInterval(revealColorLoop)
            } else {
                setTimeout(hideColor, sceneData.blind.revealDuration * 1000)
            }
        }, sceneData.blind.intervalReveal * 1000)
    } else if (sceneData.blind.mode == BlindMode.DISABLE) {
        // reveal color immediately when disable
        revealColor()
    }
}

function updatePlayerNumber(value: number) {
    // reset playersFolder
    playerFolders.forEach(folder => playersFolder.removeFolder(folder))
    playerFolders = []
    players = []

    for (let i = 0; i < value; i++) {
        // TODO: ensure color is unique
        const randomColor = new THREE.Color(0xffffff);
        randomColor.setHex(Math.random() * 0xffffff);

        const newPlayer: Player = { id: i, isAi: false, color: randomColor, score: 0 }
        const data = {
            colorHex: newPlayer.color.getHex()
        }
        players.push(newPlayer)

        const newPlayerFolder = playersFolder.addFolder(`Player ${i + 1}`)
        playerFolders.push(newPlayerFolder)
        newPlayerFolder.add(newPlayer, "isAi", false).name("AI").listen().onChange(value => {
            // kick off current player to move when being changed to AI
            if (newPlayer.isAi && newPlayer.id == currentTurn) kickOffAiMove()

            broadcast({ eventName: Event.UPDATE_PLAYER, id: newPlayer.id, isAi: newPlayer.isAi })
        })
        newPlayerFolder.addColor(data, 'colorHex').name("color").onFinishChange((value) => {
            newPlayer.color.setHex(Number(value.toString().replace('#', '0x')))

            // update countdown text color
            if (sceneData.countdown.enable && newPlayer.id == currentTurn) {
                countdownElement.style.color = "#" + newPlayer.color.getHexString()
            }

            // update seleted points to new color
            points.forEach(point => {
                if (point.userData.claim == newPlayer.id) {
                    (point as any).material.color.set(value);
                }
            })
        });

        newPlayerFolder.open()

        playersFolder.open()
        // auto close player folders after a certain time
        setTimeout(() => playersFolder.close(), 5000)
    }

    // console.log(players)
}
/* END DAT GUI */

/* CREATING */
function createLights() {
    const light = new THREE.DirectionalLight(0xe0e0e0);
    light.position.set(5, 2, 5).normalize();

    scene.add(light)
    scene.add(new THREE.AmbientLight(0x101010));
}

function createBars() {
    // reset bars
    if (bars !== undefined) {
        scene.remove(bars)
    }

    const barVectors = new THREE.Geometry();
    const R = 1//sceneData.pointRadius
    const n = sceneData.boardSize

    if (sceneData.dimension == 2) {
        for (let i = 0; i < n - 1; i++) {
            // bars parallel to y axis
            barVectors.vertices.push(new THREE.Vector3(0, R * (3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)), new THREE.Vector3(0, R * -(3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)))
            // bars parallel to z axis
            barVectors.vertices.push(new THREE.Vector3(0, R * 1.5 * (n - 2) - 3 * i, R * (3.5 + 1.5 * (n - 3))), new THREE.Vector3(0, R * 1.5 * (n - 2) - 3 * i, R * -(3.5 + 1.5 * (n - 3))))
        }

    } else {
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - 1; j++) {
                // bars parallel to x axis
                barVectors.vertices.push(new THREE.Vector3(R * (3.5 + 1.5 * (n - 3)), R * 1.5 * (n - 2) - 3 * j, R * - (1.5 * (n - 2) - 3 * i)), new THREE.Vector3(R * -(3.5 + 1.5 * (n - 3)), R * 1.5 * (n - 2) - 3 * j, R * - (1.5 * (n - 2) - 3 * i)))
                // bars parallel to y axis
                barVectors.vertices.push(new THREE.Vector3(R * 1.5 * (n - 2) - 3 * j, R * (3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)), new THREE.Vector3(R * 1.5 * (n - 2) - 3 * j, R * -(3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)))
                // bars parallel to z axis
                barVectors.vertices.push(new THREE.Vector3(R * - (1.5 * (n - 2) - 3 * i), R * 1.5 * (n - 2) - 3 * j, R * (3.5 + 1.5 * (n - 3))), new THREE.Vector3(R * - (1.5 * (n - 2) - 3 * i), R * 1.5 * (n - 2) - 3 * j, R * -(3.5 + 1.5 * (n - 3))))
            }
        }
    }

    const barMaterial = new THREE.LineBasicMaterial({
        color: sceneData.bar.color,
        linewidth: sceneData.bar.linewidth,
        transparent: true,
        opacity: sceneData.bar.opacity,
    });
    const newBars = new THREE.LineSegments(barVectors, barMaterial, THREE.LinePieces);
    bars = newBars
    bars.visible = sceneData.bar.visible
    scene.add(bars);
}

function createPoints() {
    // reset points
    points.forEach(point => scene.remove(point))
    points = []
    pointGeometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.widthSegments, sceneData.point.heightSegments)

    let index: number = 0;
    let range: number[] = []
    for (let i = 0; i < sceneData.boardSize; i++) {
        range.push((-3 * (sceneData.boardSize - 1)) / 2 + 3 * i)
    }

    // 2D
    if (sceneData.dimension == 2) {
        range.forEach(function (y) {
            range.forEach(function (z) {
                createPoint(0, y, z, index++)
            })
        })
    } else {
        range.forEach(function (x) {
            range.forEach(function (y) {
                range.forEach(function (z) {
                    createPoint(x, y, z, index++)
                })
            })
        });
    }
}

function createPoint(x: number, y: number, z: number, index: number) {
    const pointMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: sceneData.point.metalness,
        roughness: sceneData.point.roughness,
        transparent: true,
        wireframe: sceneData.point.wireframe,
        opacity: sceneData.point.opacity,
    })
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.userData.id = index
    point.userData.claim = UNCLAIMED;
    point.userData.highlight = false
    points.push(point);

    // point.userData.targetPosition = new THREE.Vector3(x, y, z)
    point.position.set(x, y, z);
    scene.add(point);
}
/* END CREATING */

/* ANIMATIONS */
// const clock: THREE.Clock = new THREE.Clock()
// const MOVE_SPEED = 0.05
export function render() {
    // console.log(Math.floor((clock.getElapsedTime()))) // seconds passed

    // points.forEach(point => {
    //     const targetX: number = point.userData.targetPosition.x
    //     const lowBoundX: number = targetX - MOVE_SPEED
    //     const highBoundX: number = targetX + MOVE_SPEED
    //     if (point.position.x != targetX) {
    //         if (point.position.x < lowBoundX) {
    //             point.position.x += MOVE_SPEED
    //         } else if (highBoundX < point.position.x) {
    //             point.position.x -= MOVE_SPEED
    //         } else {
    //             point.position.x = targetX
    //         }
    //     }
}

function yScaleDownAnimation(duration: number) {
    const loop = setInterval(function () {
        console.log("shrinking...")
        points.forEach(point => {
            point.scale.y -= (1 / 20 + 5) // increase speed for error time
            if (point.scale.y <= 0) {
                clearInterval(loop);
            }
        })
    }, duration / 20);
}

function yScaleUpAnimation(duration: number) {
    const loop = setInterval(function () {
        console.log("expanding...")
        points.forEach(point => {
            point.scale.y += (1 / 20 + 5)
            if (point.scale.y >= 1) {
                clearInterval(loop);
            }
        })
    }, duration / 20);
}

function yScaleAnimation(downDuration: number, upDuration: number) {
    yScaleDownAnimation(downDuration)
    setTimeout(() => yScaleUpAnimation(upDuration), downDuration)
}

// function updatePointsPositions() {
//     let range: number[] = []
//     for (let i = 0; i < sceneData.pointNumber; i++) {
//         range.push((-3 * (sceneData.pointNumber - 1)) / 2 + 3 * i)
//     }

//     let index: number = 0;
//     range.forEach(function (x) {
//         range.forEach(function (y) {
//             range.forEach(function (z) {
//                 (points[index++].userData.targetPosition as THREE.Vector3).set(x, y, z)
//             })
//         })
//     });
// }
/* END ANIMATIONS */

/* GAME PLAY */
function getNextTurn(currentTurn: number): number {
    let nextTurn: number
    if (currentTurn == players.length - 1) {
        nextTurn = 0 // loop
    } else {
        nextTurn = currentTurn + 1
    }

    return nextTurn
}

function resetHighlightBorders() {
    highlightBorders.forEach(border => scene.remove(border))
    highlightBorders = []
}

function resetGame() {
    resetHighlightBorders()
    // restore winCombinations
    claimedWinCombinations.forEach(winCombination => winCombinations.push(winCombination))
    // restore players' scores
    players.forEach(player => player.score = 0)
    // gameOver = false
    destroyCount = 0
    frequencyDestroyCount = 0
    // yScaleAnimation(600, 300)

    points.forEach(function (point) {
        point.userData.claim = UNCLAIMED;
        point.userData.highlight = false;
        (point.material as any).color.setHex(0xffffff);
    });

    // not generate new dead point array since can not sync it for now
    if (gameMode != GameMode.REMOTE_MULTIPLAYER)
        generateDeadPointAndToDestroyIds()
    createDeadPoints()

    outlinePass.selectedObjects = []
    addEvents()

    // fix last claimed point in previous disappear in new game
    if (lastClaimedPoint != undefined)
        lastClaimedPoint.visible = true

    // winner in previous game goes last in new game
    currentTurn = getNextTurn(currentTurn)

    if (sceneData.countdown.enable) {
        clearInterval(countDownLoop)
        activateCountDown()
    }

    if (players[currentTurn].isAi) {
        kickOffAiMove()
    }
}

function getUnclaimedPointNumber(): number {
    let count: number = 0
    points.forEach(point => {
        if (point.userData.claim == UNCLAIMED) count++
    })
    return count
}

function nextTurn() {
    frequencyDestroyCount++
    // destroy mode
    if (getUnclaimedPointNumber() != 0 && frequencyDestroyCount == sceneData.destroy.frequency) {
        for (let i = 0; i < sceneData.destroy.amount; i++) {
            if (destroyCount < toDestroyIds.length)
                destroyPoint(toDestroyIds[destroyCount++])
        }
        frequencyDestroyCount = 0
    }

    // game over
    if (checkWin() || getUnclaimedPointNumber() == 0) {
        // gameOver = true;
        (lastClaimedPoint.material as any).emissive.setHex(0x000000);
        // prevent selecting/hovering points when reseting game
        removeEvents()
        setTimeout(resetGame, 800)
    } else {
        currentTurn = getNextTurn(currentTurn)

        // reset countdown time
        if (sceneData.countdown.enable) {
            currentTurnCountDown = sceneData.countdown.time
        }

        console.log(`Current turn: ${currentTurn}`)

        if (players[currentTurn].isAi) {
            kickOffAiMove()
        }
    }
}

// check if the last move (of last player) finishes game
function checkWin() {
    let won: boolean = false;
    var breakEx = {};
    try {
        // winCombinations.forEach(function (winCombination: number[]) {
        for (let i = 0; i < winCombinations.length; i++) {
            let count = 0;
            winCombinations[i].forEach(function (index) {
                if (points[index].userData.claim == currentTurn)
                    count++;
            })
            if (count === sceneData.pointsToScore) {
                lastClaimedPoint.visible = true

                players[currentTurn].score++
                console.log(`Player ${currentTurn + 1} earnd new score: ${players[currentTurn].score}`)
                if (players[currentTurn].score == sceneData.multiScore.scoresToWin && !sceneData.multiScore.highestScoreToWin) {
                    won = true;
                }

                winCombinations[i].forEach(function (index) {
                    if (!points[index].userData.highlight)
                        createHighlightBorder(points[index])
                    points[index].userData.highlight = true

                    if (!sceneData.multiScore.overlapping)
                        // override color claim so that points will not be counted for another combinations
                        points[index].userData.claim = CLAIMED
                    // outlinePass.selectedObjects.push(points[index])
                })

                claimedWinCombinations.push(winCombinations.splice(i, 1)[0])
                throw breakEx;
            }
        }
    } catch (ex) {
        if (ex != breakEx) throw ex;
    }
    return won;
}

// TODO: update point scale, color along with its border
// TODO: Dat option for borders
function createHighlightBorder(point: THREE.Mesh) {
    const pointMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({
        color: players[currentTurn].color,
        // metalness: sceneData.point.metalness,
        // roughness: sceneData.point.roughness,
        // transparent: true,
        wireframe: sceneData.point.wireframe,
        // opacity: 0.7,
        side: THREE.BackSide,
    })
    const border = new THREE.Mesh(pointGeometry, pointMaterial);
    border.userData.claim = currentTurn
    border.scale.multiplyScalar(1.2)
    border.position.set(point.position.x, point.position.y, point.position.z)
    // point.userData.targetPosition = new THREE.Vector3(x, y, z)
    highlightBorders.push(border)
    scene.add(border);
}
/* END GAME PLAY */


/* AI */
function kickOffAiMove() {
    // removeEvents()
    setTimeout(() => {
        aiMove()
        nextTurn()
        // addEvents()
    }, sceneData.ai.delay)
}
function aiMove() {
    // scan combinations not be blocked first
    for (let blocked = 0; blocked <= 1; blocked++) {
        for (let i = 1; i <= sceneData.ai.defensive; i++) {
            for (let winCombination of winCombinations) {
                countClaims(winCombination);

                // offensive move when AI has more claimed points than opponents
                if (ClaimCounter.currentPlayerCount == sceneData.pointsToScore - i && ClaimCounter.previousPlayersMaxCount == blocked) {
                    console.log(`AI: attacking move [AI: ${sceneData.pointsToScore - i + 1}; blocked: ${blocked}]`)
                    let idToMove: number = 99999
                    winCombination.forEach(function (id) {
                        if (points[id].userData.claim == UNCLAIMED) {
                            // selet the closest point
                            if (Math.abs(id - lastClaimedPoint.userData.id) < idToMove) {
                                idToMove = id
                            }
                        }
                    });
                    // console.log(`idToMove: ${idToMove}`)
                    if (idToMove != 99999) {
                        updateClaimedPoint(points[idToMove])
                        return
                    }
                }

                // defensing move (when opponent is i points away from pointsToScore)
                if (ClaimCounter.previousPlayersMaxCount == sceneData.pointsToScore - i && ClaimCounter.currentPlayerCount == blocked) {
                    console.log(`AI: defensing move [opponent: ${sceneData.pointsToScore - i}; blocked: ${blocked + 1}]`)
                    // the seleted point index among possible points
                    let idToMove: number = 99999
                    winCombination.forEach(function (id) {
                        if (points[id].userData.claim == UNCLAIMED) {
                            // selet the closest point
                            if (Math.abs(id - lastClaimedPoint.userData.id) < idToMove) {
                                idToMove = id
                            }
                        }
                    });
                    // console.log(`idToMove: ${idToMove}`)
                    if (idToMove != 99999) {
                        updateClaimedPoint(points[idToMove])
                        return
                    }
                }
            }
        }
    }

    // pre-defined/prefferred move (position meets the most win combination, e.g. center)
    // TODO: generate preferredIndexes to improve AI
    for (let index of aiPreferredMoves) {
        if (points[index].userData.claim == UNCLAIMED) {
            console.log("AI: preferred move")
            updateClaimedPoint(points[index])
            return
        }
    };

    // random move (all the preferred are taken, just take first unclaimed)
    for (let point of points) {
        if (point.userData.claim == UNCLAIMED) {
            console.log("AI: random move")
            updateClaimedPoint(point)
            return
        }
    };
}

// just randomize for now
function generateAiPreferredMoves() {
    aiPreferredMoves = generateRandomIds()
    console.log("Generating AI preferred moves...")
    console.log(aiPreferredMoves)

    if (gameMode == GameMode.REMOTE_MULTIPLAYER) {
        socket.emit("broadcast", { eventName: Event.SYNC_AI, aiPreferredMoves: aiPreferredMoves })
    }
}

// utility
function generateRandomIds() {
    const legitIds: number[] = []
    for (let i = 0; i < Math.pow(sceneData.boardSize, sceneData.dimension); i++) {
        legitIds.push(i)
    }
    return shuffleArray(legitIds)
}

// utility
// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray(array: number[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

// to indentify how many points claimed in each winCombination for previous and current players
const ClaimCounter = {
    previousPlayersMaxCount: 0, // the largest count of other players from last turn
    currentPlayerCount: 0
}
function countClaims(winCombination: number[]) {
    ClaimCounter.currentPlayerCount = 0
    ClaimCounter.previousPlayersMaxCount = 0
    let tempMaxCount: number = 0

    players.forEach(player => {
        if (player.id != currentTurn) {
            winCombination.forEach(function (index) {
                if (points[index].userData.claim == player.id) {
                    tempMaxCount++
                }
            });

            if (tempMaxCount > ClaimCounter.previousPlayersMaxCount) {
                ClaimCounter.previousPlayersMaxCount = tempMaxCount
            }
            tempMaxCount = 0
        }
    })

    winCombination.forEach(index => {
        if (points[index].userData.claim == currentTurn) {
            ClaimCounter.currentPlayerCount++
        }
    })
    // console.log(`${ClaimCounter.previousPlayerCount} ${ClaimCounter.currentPlayerCount}`)
}
/* END AI */

/* EVENTS */
export function addEvents() {
    window.addEventListener('mousemove', hoverPoint, false)
    window.addEventListener('contextmenu', claimPoint, false);
}

export function removeEvents() {
    window.removeEventListener('mousemove', hoverPoint, false)
    window.removeEventListener('contextmenu', claimPoint, false);
}

function claimPoint(event: MouseEvent) {
    if (players[currentTurn].isAi) return;
    if (event.button != 2) return // right click only

    event.preventDefault()

    const intersectObjects: THREE.Intersection[] = getIntersectObjects(event)
    if (intersectObjects.length) {
        const selectedPoint = intersectObjects[0].object as THREE.Mesh
        if (selectedPoint.userData.claim == UNCLAIMED) {
            updateClaimedPoint(selectedPoint)

            if (gameMode == GameMode.REMOTE_MULTIPLAYER) {
                socket.emit('broadcast', { eventName: Event.PLAYER_MOVE, id: selectedPoint.userData.id, color: currentTurn });
            }

            // remove hover effect right after seleting
            (selectedPoint.material as any).emissive.setHex(0x000000);

            nextTurn();
        }
    }
}

function updateClaimedPoint(selectedPoint: THREE.Mesh) {
    if (sceneData.blind.mode != BlindMode.ALL_PLAYERS) {
        (selectedPoint.material as any).color.set(players[currentTurn].color);
    }
    selectedPoint.userData.claim = currentTurn;
    claimedPointIds.push(selectedPoint.userData.id)

    // un-highlight previous selected point
    if (lastClaimedPoint !== undefined) {
        // (lastSelectedPoint.material as THREE.Material).depthWrite = true
    }

    // update and highlight new selected point
    lastClaimedPoint = selectedPoint;
    // console.log(`Selected index: ${lastSelectedPoint.userData.id}`)
    // (lastSelectedPoint.material as THREE.Material).depthWrite = false

    // outline other players' last moves
    if (outlinePass !== undefined) {
        if (outlinePass.selectedObjects.length == sceneData.playerNumber - 1) {
            outlinePass.selectedObjects.shift()
        }
        outlinePass.selectedObjects.push(lastClaimedPoint)
    }
}

let hoveredPoint: THREE.Mesh | null
function hoverPoint(event: MouseEvent) {
    if (players[currentTurn].isAi) return;

    const intersectObjects: THREE.Intersection[] = getIntersectObjects(event)

    if (intersectObjects.length) {
        const currentHoveredPoint = intersectObjects[0].object as THREE.Mesh
        // no affect on claimed points
        if (currentHoveredPoint.userData.claim != UNCLAIMED) return
        // if move to new unclaimed point
        if (hoveredPoint != currentHoveredPoint) {
            if (hoveredPoint)
                (hoveredPoint.material as any).emissive.set((hoveredPoint as any).currentHex);
            hoveredPoint = currentHoveredPoint;
            (hoveredPoint as any).currentHex = (hoveredPoint.material as any).emissive.getHex();
            // console.log(`Point id: ${hoveredPoint.userData.id}`);

            (hoveredPoint.material as any).emissive.set(players[currentTurn].color);

        }
    } else {
        if (hoveredPoint)
            (hoveredPoint.material as any).emissive.setHex((hoveredPoint as any).currentHex);
        hoveredPoint = null;
    }
}

function getIntersectObjects(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera)
    return raycaster.intersectObjects(points, false) as THREE.Intersection[]
}
/* END EVENTS */