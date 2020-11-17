/* 
TODO: 
    - *Generate all win combinations for 3D when win point < board size
    - *Implement remote multi-player mode 
    - *Implement different win shapes (instead of normal line)
    - *Fix size point not update when change size board
    - Customize point geometry (cube...)
    - Customize AI (intelligent)
    - More cool effects/animations for game scenes (start, reset)
    - Fix game reseting animation (y scaling)
    - Implement n-multi-win (n>=2)
    - Implement n-dimentional board (n>=4)
    - Implement blind mode (no color)
    - Implement countdown mode
    - Implement different tic tac toe variants
    - VR support
    - Mobile responsive
    - Enhance bars (with MeshLine...)
    - Lock winpoint when start game (prevent cheating)
*/

import { GUI, GUIController } from '/jsm/libs/dat.gui.module.js'
import * as THREE from '/build/three.module.js'
import { socket, outlinePass, raycaster, mouse, camera, transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string = 'arid'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let sceneData = {
    playerNumber: 2,
    dimension: 3,
    boardSize: 3,
    winPoint: 3,
    ai: {
        delay: 500,
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

const textElement = document.querySelector("#top-text")!

type Player = {
    id: number,
    isAi: boolean,
    color: THREE.Color
}
let players: Player[] = []

enum GameMode { LOCAL_MULTIPLAYER, REMOTE_MULTIPLAYER }
let gameMode: GameMode = GameMode.LOCAL_MULTIPLAYER

const UNCLAIMED: number = -1
let currentTurn: number = 0
let aiPreferredMoves: number[] // array of point indexes for aiMove()
var gameOver: boolean = false;
let winCombinations: number[][] = []
let testCombination: number[] = []
let movedCount: number = 0 // keep track when all point are claimed

let bars: THREE.LineSegments
let pointGeometry: THREE.SphereGeometry
let points: THREE.Mesh[] = [];
let lastSelectedPoint: THREE.Mesh

export function init() {
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    textElement.innerHTML = "Right click to select"

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
        setTimeout(() => {
            aiMove()
            nextTurn()
        }, sceneData.ai.delay)
    }
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

// const clock: THREE.Clock = new THREE.Clock()
// const MOVE_SPEED = 0.05
export function render() {
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

    //     const targetY: number = point.userData.targetPosition.y
    //     const lowBoundY: number = targetY - MOVE_SPEED
    //     const highBoundY: number = targetY + MOVE_SPEED
    //     if (point.position.y != targetY) {
    //         if (point.position.y < lowBoundY) {
    //             point.position.y += MOVE_SPEED
    //         } else if (highBoundY < point.position.y) {
    //             point.position.y -= MOVE_SPEED
    //         } else {
    //             point.position.y = targetY
    //         }
    //     }

    //     const targetZ: number = point.userData.targetPosition.z
    //     const lowBoundZ: number = targetZ - MOVE_SPEED
    //     const highBoundZ: number = targetZ + MOVE_SPEED
    //     if (point.position.z != targetZ) {
    //         if (point.position.z < lowBoundZ) {
    //             point.position.z += MOVE_SPEED
    //         } else if (highBoundZ < point.position.z) {
    //             point.position.z -= MOVE_SPEED
    //         } else {
    //             point.position.z = targetZ
    //         }
    //     }
    // })
}

function initGame() {
    // testCombination = []
    movedCount = 0
    createPoints()
    createBars()
    generateWinCombinations()
    generateAiPreferredMoves()
    // testCombination.forEach(index => (points[index].material as any).emissive.setHex(0xff0000))
}

function generateWinCombinations() {
    const n = sceneData.boardSize
    // reset combinations
    winCombinations = []
    let winCombination: number[] = []

    // lines parallel to z axis (common fomular for both 2D and 3D)
    for (let i = 0; i <= Math.pow(n, sceneData.dimension) - n; i += n) {
        const winCombination: number[] = []
        for (let j = i; j < i + n; j++) {
            winCombination.push(j)
        }
        winCombinations.push(winCombination)
    }

    if (sceneData.dimension == 2) {
        // lines parallel to y axis
        for (let i = 0; i < n; i++) {
            const winCombination: number[] = []
            for (let j = 0; j < n; j++) {
                winCombination.push(i + n * j)
            }
            winCombinations.push(winCombination)
        }

        // 2 diagonal lines
        winCombination = []
        for (let i = 0; i <= Math.pow(n, 2); i += n + 1) {
            winCombination.push(i)
        }
        winCombinations.push(winCombination)

        winCombination = []
        for (let i = n - 1; i <= Math.pow(n, 2) - n; i += n - 1) {
            winCombination.push(i)
        }
        winCombinations.push(winCombination)

        updateWinCombinationsOnWinPoint()
        return
    }

    // n^2 lines parallel to x axis
    for (let i = 0; i < Math.pow(n, 2); i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + Math.pow(n, 2) * j)
        }
        winCombinations.push(winCombination)
    }

    // n^2 lines parallel to y axis
    for (let a = 0; a <= n - 1; a++) {
        for (let i = Math.pow(n, 2) * a; i < Math.pow(n, 2) * a + n; i++) {
            const winCombination: number[] = []
            for (let j = 0; j < n; j++) {
                winCombination.push(i + j * n)
            }
            // console.log(winCombination)
            winCombinations.push(winCombination)
        }
    }

    // diagonal lines parallel to xy face
    for (let i = 0; i < n; i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) + n) * j)
        }
        winCombinations.push(winCombination)
    }
    for (let i = Math.pow(n, 2) - n; i < Math.pow(n, 2); i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) - n) * j)
        }
        winCombinations.push(winCombination)
    }

    // diagonal lines parallel to xz face
    for (let i = 0; i <= Math.pow(n, 2) - n; i += n) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) + 1) * j)
        }
        winCombinations.push(winCombination)
    }
    for (let i = n - 1; i <= Math.pow(n, 2) - 1; i += n) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (Math.pow(n, 2) - 1) * j)
        }
        winCombinations.push(winCombination)
    }

    // diagonal lines parallel to yz face
    for (let i = 0; i <= Math.pow(n, 2) * (n - 1); i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n + 1) * j)
        }
        winCombinations.push(winCombination)
    }
    for (let i = n - 1; i <= Math.pow(n, 2) * (n - 1) + n - 1; i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n - 1) * j)
        }
        winCombinations.push(winCombination)
    }

    // 4 diagonal lines across the origin
    for (let i = 0; i < n; i++) {
        winCombination.push(i + (Math.pow(n, 2) + n) * i)
    }
    winCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(n - 1 + (Math.pow(n, 2) + n - 1) * i)
    }
    winCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(Math.pow(n, 2) - n + (Math.pow(n, 2) - n + 1) * i)
    }
    winCombinations.push(winCombination)

    winCombination = []
    for (let i = 0; i < n; i++) {
        winCombination.push(Math.pow(n, 2) - 1 + (Math.pow(n, 2) - n - 1) * i)
    }
    winCombinations.push(winCombination)

    // console.log(winCombinations)

    updateWinCombinationsOnWinPoint()
}

function updateWinCombinationsOnWinPoint() {
    console.log(winCombinations)

    const n = sceneData.boardSize
    const m = sceneData.winPoint
    if (m == n) return

    // TODO: missing combinations (diagonal lines)
    let winCombination: number[] = []
    if (sceneData.dimension == 2) {
        for (let dif = 1; dif <= n - m; dif++) {
            winCombination = []
            for (let i = 0; i < n - dif; i++) {
                winCombination.push(dif + i * (n + 1))
            }
            winCombinations.push(winCombination)

            winCombination = []
            for (let i = 0; i < n - dif; i++) {
                winCombination.push(dif * n + i * (n + 1))
            }
            winCombinations.push(winCombination)

            winCombination = []
            for (let i = 0; i < n - dif; i++) {
                winCombination.push((n - 1) - dif + i * (n - 1))
            }
            winCombinations.push(winCombination)

            winCombination = []
            for (let i = 0; i < n - dif; i++) {
                winCombination.push(dif * n + (n - 1) + i * (n - 1))
            }
            winCombinations.push(winCombination)
        }
    }

    winCombinations = extractSubCombinations(winCombinations, m)
    // console.log(winCombinations)
}

// get all the subsets of m-adjacent elements
// original combinations could have different array size  >= m
function extractSubCombinations(originalCombinations: number[][], m: number): number[][] {
    const newCombinations: number[][] = []
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

function createLights() {
    const light = new THREE.DirectionalLight(0xe0e0e0);
    light.position.set(5, 2, 5).normalize();

    scene.add(light)
    scene.add(new THREE.AmbientLight(0x101010));
}

/* DAT GUI */
let playerFolders: GUI[] = []
let playersFolder: GUI
let playerNumberController: GUIController
function createDatGUI() {
    const options = {
        winPoint: sceneData.winPoint,
        dimension: {
            "2D": 2,
            "3D": 3
        },
        mode: {
            "Local multi-player": GameMode.LOCAL_MULTIPLAYER,
            "Remote multi-player": GameMode.REMOTE_MULTIPLAYER,
        }
    }

    const selectedGameMode = {
        name: GameMode.LOCAL_MULTIPLAYER,
    }

    let winPointController: GUIController

    gui = new GUI()
    gui.add(selectedGameMode, "name", options.mode).name("Game mode").onChange(value => {
        gameMode = value
    })

    playerNumberController = gui.add(sceneData, "playerNumber", 2, 10, 1).name("Player number").onFinishChange(value => {
        updatePlayerNumber(value)
    })
    playersFolder = gui.addFolder("Players")
    playersFolder.open()

    gui.add(sceneData, "dimension", options.dimension).name("Dimension").onChange(value => {
        if (value == 3) {
            // update winpoint
            options.winPoint = sceneData.boardSize
            sceneData.winPoint = sceneData.boardSize
            winPointController.updateDisplay()
        }
        initGame()
    })

    gui.add(sceneData, "boardSize", 3, 30).step(1).name("Board size").onFinishChange((value) => {
        // update winpoint
        options.winPoint = value
        sceneData.winPoint = value
        winPointController.updateDisplay()

        initGame()
    })

    winPointController = gui.add(options, "winPoint", 3, 30).step(1).name("Win point").onFinishChange(value => {
        if (sceneData.dimension == 3) {
            alert("This feature in 3D board is under development.")
            winPointController.setValue(sceneData.winPoint)
        }
        else if (value > sceneData.boardSize) {
            alert("Win point should not be greater than board size!")
            winPointController.setValue(sceneData.winPoint)
        }
        else {
            sceneData.winPoint = options.winPoint
            updateWinCombinationsOnWinPoint()
        }
    })

    const aisFolder: GUI = gui.addFolder("AIs")
    aisFolder.add(sceneData.ai, "delay", 0, 2000, 100).name("delay (ms)")

    const pointsFolder: GUI = gui.addFolder("Points")
    pointsFolder.add(sceneData.point, "wireframe", false).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).wireframe = value)
    })
    pointsFolder.add(sceneData.point, "radius", 0.5, 1, 0.1).name("size").onFinishChange(radius => {
        points.forEach(point => {
            point.scale.x = radius
            point.scale.y = radius
            point.scale.z = radius
            // updatePointsPositions()
        })
    })

    pointsFolder.add(sceneData.point, "roughness", 0, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).roughness = value)
    })
    pointsFolder.add(sceneData.point, "metalness", 0, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).metalness = value)
    })
    pointsFolder.add(sceneData.point, "opacity", 0.5, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).opacity = value)
    })
    pointsFolder.add(sceneData.point, "widthSegments", 1, 25).onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.widthSegments, sceneData.point.heightSegments)
        })
    })
    pointsFolder.add(sceneData.point, "heightSegments", 1, 25).onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.point.radius, sceneData.point.radius, sceneData.point.radius)
        })
    })
    // pointsFolder.open()

    const barsFolder = gui.addFolder("Bars")
    barsFolder.add(sceneData.bar, "visible", true).name("visible").onChange(value => bars.visible = value);
    barsFolder.add(sceneData.bar, "opacity", 0, 1).onFinishChange(value => {
        (bars.material as THREE.LineBasicMaterial).opacity = value
    })
    barsFolder.add(sceneData.bar, "linewidth", 0, 10).name("thicc").onFinishChange(value => {
        (bars.material as THREE.LineBasicMaterial).linewidth = value
    })
    const barData = {
        color: ((bars.material as THREE.LineBasicMaterial).color as THREE.Color).getHex(),
    };
    barsFolder.addColor(barData, 'color').onChange((value) => {
        sceneData.bar.color = value;
        ((bars.material as THREE.LineBasicMaterial).color as THREE.Color).setHex(Number(barData.color.toString().replace('#', '0x')))
    });
    // barsFolder.open();
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

        const newPlayer: Player = { id: i, isAi: false, color: randomColor }
        const data = {
            colorHex: newPlayer.color.getHex()
        }
        players.push(newPlayer)

        const newPlayerFolder = playersFolder.addFolder(`Player ${i + 1}`)
        playerFolders.push(newPlayerFolder)
        // TODO: kick off current player to move when being changed to AI
        newPlayerFolder.add(newPlayer, "isAi", false).name("AI").listen()
        newPlayerFolder.addColor(data, 'colorHex').name("color").onChange((value) => {
            newPlayer.color.setHex(Number(value.toString().replace('#', '0x')))

            // update seleted point to new color
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

    console.log(players)
}
/* END DAT GUI */

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
    points.push(point);

    // point.userData.targetPosition = new THREE.Vector3(x, y, z)
    point.position.set(x, y, z);
    scene.add(point);
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

/* ANIMATIONS */
function yScaleDownAnimation(duration: number) {
    const loop = setInterval(function () {
        console.log("shrinking...")
        points.forEach(point => {
            point.scale.y -= 1 / 20
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
            point.scale.y += 1 / 20
            if (point.scale.y >= 1) {
                clearInterval(loop);
            }
        })
    }, duration / 20);
}

function yScaleAnimation(downDuration: number, upDuration: number) {
    yScaleDownAnimation(downDuration)
    setTimeout(() => yScaleUpAnimation(upDuration), downDuration + 200) // error
}
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

function resetGame() {
    // gameOver = false
    movedCount = 0
    yScaleAnimation(600, 300)

    points.forEach(function (point) {
        point.userData.claim = UNCLAIMED;
        (point.material as any).color.setHex(0xffffff);
    });

    outlinePass.selectedObjects = []
    addEvents()
    lastSelectedPoint.visible = true

    // winner in previous game goes last in new game
    currentTurn = getNextTurn(currentTurn)

    if (players[currentTurn].isAi) {
        setTimeout(() => {
            aiMove()
            nextTurn()
        }, sceneData.ai.delay)
    }
}

function nextTurn() {
    // game over
    if (checkWin() || movedCount == Math.pow(sceneData.boardSize, sceneData.dimension)) {
        // gameOver = true;
        (lastSelectedPoint.material as any).emissive.setHex(0x000000);
        // prevent selecting/hovering points when reseting game
        removeEvents()
        setTimeout(resetGame, 800)
    } else {
        currentTurn = getNextTurn(currentTurn)

        console.log(`Current turn: ${currentTurn}`)

        if (players[currentTurn].isAi) {
            setTimeout(() => {
                aiMove()
                nextTurn()
            }, sceneData.ai.delay)
        }
    }
}

// check if the last move finishes the game
function checkWin() {
    let won: boolean = false;
    var breakEx = {};
    try {
        winCombinations.forEach(function (winCombination: number[]) {
            let count = 0;
            winCombination.forEach(function (index) {
                if (points[index].userData.claim == currentTurn)
                    count++;
            })
            if (count === sceneData.winPoint) {
                won = true;

                winCombination.forEach(function (index) {
                    outlinePass.selectedObjects.push(points[index])
                })
                throw breakEx;
            }
        })
    } catch (ex) {
        if (ex != breakEx) throw ex;
    }
    return won;
}
/* END GAME PLAY */

/* AI */
function aiMove() {
    // attacking move (finish game)
    for (let winCombination of winCombinations) {
        countClaims(winCombination);
        if (ClaimCounter.currentPlayerCount == sceneData.winPoint - 1) {
            console.log("AI: attacking move")
            for (let index of winCombination) {
                if (points[index].userData.claim == UNCLAIMED) {
                    updateSelectedPoint(points[index]);
                    return
                }
            };
        }
    }

    // defensing move (higher threat case)
    // TODO: detect higher threat case (thread is blocked one side<thread is not blocked)
    for (let winCombination of winCombinations) {
        countClaims(winCombination);
        // if in this combination previous player claimed more than (win point - 1) points
        // while current player has no claimed point
        if (ClaimCounter.previousPlayerCount == sceneData.winPoint - 1 && ClaimCounter.currentPlayerCount == 0) {
            console.log("AI: defensing move [1]")
            for (let id of winCombination) {
                if (points[id].userData.claim == UNCLAIMED) {
                    updateSelectedPoint(points[id])
                    return
                }
            };
        }
    };

    // defensing move
    for (let winCombination of winCombinations) {
        countClaims(winCombination);
        if (ClaimCounter.previousPlayerCount == sceneData.winPoint - 2 && ClaimCounter.currentPlayerCount == 0) {
            console.log("AI: defensing move [2]")
            // the seleted point index among possible points
            let idToMove: number = 99999
            winCombination.forEach(function (id) {
                if (points[id].userData.claim == UNCLAIMED) {
                    // selet the closest point
                    if (Math.abs(id - lastSelectedPoint.userData.id) < idToMove) {
                        idToMove = id
                    }
                }
            });
            // console.log(`idToMove: ${idToMove}`)
            updateSelectedPoint(points[idToMove])
            return
        }
    };

    // random move
    // TODO: generate preferredIndexes to improve AI
    // const preferredIndexes: number[] = [13, 16, 10, 3, 4, 5, 21, 22, 23, 12, 14];
    for (let index of aiPreferredMoves) {
        if (points[index].userData.claim == UNCLAIMED) {
            console.log("AI: preferred move")
            updateSelectedPoint(points[index])
            return
        }
    };

    // all the preferred are taken, just take first unclaimed
    for (let point of points) {
        if (point.userData.claim == UNCLAIMED) {
            console.log("AI: random move")
            updateSelectedPoint(point)
            return
        }
    };
}

// just randomize for now
function generateAiPreferredMoves() {
    const legitIndexes: number[] = []
    for (let i = 0; i < Math.pow(sceneData.boardSize, sceneData.dimension); i++) {
        legitIndexes.push(i)
    }
    aiPreferredMoves = shuffleArray(legitIndexes)
}

// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray(array: number[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

// to indentify how many points claimed in each winCombination for previous and current players
// TODO: indentify counts for all players and choose the largest
const ClaimCounter = {
    previousPlayerCount: 0,
    currentPlayerCount: 0
}
function countClaims(winCombination: number[]) {
    let previousTurn: number
    if (currentTurn == 0) {
        previousTurn = players.length - 1 // loop
    } else {
        previousTurn = currentTurn - 1
    }

    ClaimCounter.currentPlayerCount = 0
    ClaimCounter.previousPlayerCount = 0

    winCombination.forEach(function (index) {
        if (points[index].userData.claim == previousTurn) {
            ClaimCounter.previousPlayerCount++
        }
        if (points[index].userData.claim == currentTurn) {
            ClaimCounter.currentPlayerCount++
        }
    });
    // console.log(`${ClaimCounter.previousPlayerCount} ${ClaimCounter.currentPlayerCount}`)
}
/* END AI */

/* EVENTS */
// TODO: setup for all tasks
export function addEvents() {
    window.addEventListener('mousemove', hoverPoint, false)
    window.addEventListener('contextmenu', selectPoint, false);
}

export function removeEvents() {
    window.removeEventListener('mousemove', hoverPoint, false)
    window.removeEventListener('contextmenu', selectPoint, false);
}

function selectPoint(event: MouseEvent) {
    event.preventDefault()
    if (event.button != 2) return // right click only

    const intersectObjects: THREE.Intersection[] = getIntersectObjects(event)
    if (intersectObjects.length) {
        const selectedPoint = intersectObjects[0].object as THREE.Mesh
        if (selectedPoint.userData.claim == UNCLAIMED) {
            updateSelectedPoint(selectedPoint)

            if (gameMode == GameMode.REMOTE_MULTIPLAYER) {
                socket.emit('tictactoe_changeTurn', { id: selectedPoint.userData.id, color: currentTurn });
            }

            // remove hover effect right after seleting
            (selectedPoint.material as any).emissive.setHex(0x000000);

            nextTurn();
        }
    }
}

function setupSocket() {
    socket.on("updateTurn", (data: any) => {
        if (gameMode != GameMode.REMOTE_MULTIPLAYER) return
        // (points[data.id].material as any).color.set(players[currentTurn].color);
        updateSelectedPoint(points[data.id])
        nextTurn();
    })
}

function updateSelectedPoint(selectedPoint: THREE.Mesh) {
    (selectedPoint.material as any).color.set(players[currentTurn].color);
    selectedPoint.userData.claim = currentTurn;

    // un-highlight previous selected point
    if (lastSelectedPoint !== undefined) {
        // (lastSelectedPoint.material as THREE.Material).depthWrite = true
    }

    // update and highlight new selected point
    lastSelectedPoint = selectedPoint;
    // console.log(`Selected index: ${lastSelectedPoint.userData.id}`)
    // (lastSelectedPoint.material as THREE.Material).depthWrite = false
    if (outlinePass !== undefined)
        outlinePass.selectedObjects = [lastSelectedPoint as THREE.Object3D]
}

let hoveredPoint: THREE.Mesh | null
function hoverPoint(event: MouseEvent) {
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