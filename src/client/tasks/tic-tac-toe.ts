import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { raycaster, mouse, camera, transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string = 'dust'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let sceneData = {
    pointNumber: 5,
    wireframe: false,
    pointRadius: 1,
    metalness: 0.4,
    roughness: 0.19,
    opacity: 1,
    widthSegments: 25,
    heightSegments: 25,
}

const UNCLAIMED: number = 0
const RED: number = 1
const GREEN: number = 2
let currentTurn: number = RED
let vsAi: boolean = true  // RED
var gameOver: boolean = false;
let winCombinations: number[][] = []

let cage: THREE.LineSegments
let pointGeometry: THREE.SphereGeometry
let points: THREE.Mesh[] = [];

export function init() {
    isInitialized = true
    scene.background = new THREE.Color(0x333333)

    generateWinCombinations()
    createLights()
    createCage()
    createPoints()
    setupControls()
    createDatGUI()

    transformableObjects.forEach(child => {
        scene.add(child)
    })

    // start game with AI
    if (currentTurn == RED && vsAi == true) {
        aiMove()
        changeTurn(RED)
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


function generateWinCombinations() {
    const n = sceneData.pointNumber
    // reset combinations
    winCombinations = []

    // n^2 lines parallel to x axis
    for (let i = 0; i < Math.pow(n, 2); i++) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + Math.pow(n, 2) * j)
        }
        winCombinations.push(winCombination)
    }

    // n^2 lines parallel to y axis
    for (let a = n - 3; a <= n - 1; a++) {
        for (let i = Math.pow(n, 2) * a; i < Math.pow(n, 2) * a + n; i++) {
            const winCombination: number[] = []
            for (let j = 0; j < n; j++) {
                winCombination.push(i + j * n)
            }
            winCombinations.push(winCombination)
        }
    }

    // n^2 lines parallel to z axis
    for (let i = 0; i <= Math.pow(n, 3) - n; i += n) {
        const winCombination: number[] = []
        for (let j = i; j < i + n; j++) {
            winCombination.push(j)
        }
        winCombinations.push(winCombination)
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
    for (let i = 0; i <= Math.pow(n, 2) * 2; i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n + 1) * j)
        }
        winCombinations.push(winCombination)
    }
    for (let i = n - 1; i <= Math.pow(n, 2) * 2 + n - 1; i += Math.pow(n, 2)) {
        const winCombination: number[] = []
        for (let j = 0; j < n; j++) {
            winCombination.push(i + (n - 1) * j)
        }
        winCombinations.push(winCombination)
    }

    // 4 diagonal lines across the origin
    let winCombination: number[] = []
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
}

function createLights() {
    const light = new THREE.DirectionalLight(0xe0e0e0);
    light.position.set(5, 2, 5).normalize();

    scene.add(light)
    scene.add(new THREE.AmbientLight(0x101010));
}

function createDatGUI() {
    const gameModes = {
        "Play with AI": true,
        "Local multi-player": false,
    }
    const selectedGameMode = {
        vsAi: true
    }
    gui = new GUI()
    gui.add(selectedGameMode, "vsAi", gameModes).name("Game mode").onChange(value => {
        vsAi = value
    })

    gui.add(sceneData, "pointNumber", 3, 20).step(1).name("A x A x A").onFinishChange(() => {
        generateWinCombinations()
        createPoints()
        createCage()
    })

    const pointsFolder: GUI = gui.addFolder("Points")
    pointsFolder.add(sceneData, "wireframe", false).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).wireframe = value)
    })
    pointsFolder.add(sceneData, "pointRadius", 0.5, 1, 0.1).name("size").onFinishChange(radius => {
        console.log(sceneData.pointRadius)
        points.forEach(point => {
            point.scale.x = radius
            point.scale.y = radius
            point.scale.z = radius
            // updatePointsPositions()
        })
    })

    // const pointsMaterialFolder: GUI = pointsFolder.addFolder("Material")
    pointsFolder.add(sceneData, "roughness", 0, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).roughness = value)
    })
    pointsFolder.add(sceneData, "metalness", 0, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).metalness = value)
    })
    pointsFolder.add(sceneData, "opacity", 0.5, 1).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).opacity = value)
    })
    pointsFolder.add(sceneData, "widthSegments", 1, 25).onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.pointRadius, sceneData.widthSegments, sceneData.heightSegments)
        })
    })
    pointsFolder.add(sceneData, "heightSegments", 1, 25).onFinishChange(value => {
        points.forEach(point => {
            point.geometry.dispose()
            point.geometry = new THREE.SphereGeometry(sceneData.pointRadius, sceneData.widthSegments, sceneData.heightSegments)
        })
    })

    pointsFolder.open()
}

function createCage() {
    // reset cage
    if (cage !== undefined) {
        scene.remove(cage)
        console.log(cage.children)
    }

    const bars = new THREE.Geometry();
    const R = 1//sceneData.pointRadius
    const n = sceneData.pointNumber
    const n2 = Math.pow(n, 2)

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1; j++) {
            // bars parallel to x axis
            bars.vertices.push(new THREE.Vector3(R * (3.5 + 1.5 * (n - 3)), R * 1.5 * (n - 2) - 3 * j, R * - (1.5 * (n - 2) - 3 * i)), new THREE.Vector3(R * -(3.5 + 1.5 * (n - 3)), R * 1.5 * (n - 2) - 3 * j, R * - (1.5 * (n - 2) - 3 * i)))
            // bars parallel to y axis
            bars.vertices.push(new THREE.Vector3(R * 1.5 * (n - 2) - 3 * j, R * (3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)), new THREE.Vector3(R * 1.5 * (n - 2) - 3 * j, R * -(3.5 + 1.5 * (n - 3)), R * - (1.5 * (n - 2) - 3 * i)))
            // bars parallel to z axis
            bars.vertices.push(new THREE.Vector3(R * - (1.5 * (n - 2) - 3 * i), R * 1.5 * (n - 2) - 3 * j, R * (3.5 + 1.5 * (n - 3))), new THREE.Vector3(R * - (1.5 * (n - 2) - 3 * i), R * 1.5 * (n - 2) - 3 * j, R * -(3.5 + 1.5 * (n - 3))))
        }
    }

    const newCage = new THREE.LineSegments(bars, new THREE.LineBasicMaterial(), THREE.LinePieces);
    cage = newCage
    scene.add(cage);
}

function createPoints() {
    // reset points
    points.forEach(point => scene.remove(point))
    points = []
    console.log(points)
    pointGeometry = new THREE.SphereGeometry(sceneData.pointRadius, sceneData.widthSegments, sceneData.heightSegments)

    let range: number[] = []
    for (let i = 0; i < sceneData.pointNumber; i++) {
        range.push((-3 * (sceneData.pointNumber - 1)) / 2 + 3 * i)
    }

    let index: number = 0;
    range.forEach(function (x) {
        range.forEach(function (y) {
            range.forEach(function (z) {
                const pointMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    metalness: sceneData.metalness,
                    roughness: sceneData.roughness,
                    transparent: true,
                    wireframe: sceneData.wireframe,
                    opacity: sceneData.opacity,
                })
                const point = new THREE.Mesh(pointGeometry, pointMaterial);
                point.userData.id = index++
                point.userData.claim = UNCLAIMED;
                points.push(point);

                point.userData.targetPosition = new THREE.Vector3(x, y, z)
                point.position.set(x, y, z);
                scene.add(point);
            })
        })
    });
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

function resetGame() {
    points.forEach(function (point) {
        point.userData.claim = UNCLAIMED;
        (point.material as any).color.setHex(0xffffff);
    });

    // loser in previous game goes first in new game
    currentTurn = ((currentTurn == RED) ? GREEN : RED);

    // TODO: refactor duplication
    if (currentTurn == RED && vsAi == true) {
        aiMove()
        changeTurn(RED)
    }
}

function checkWin(color: number) {
    let won: boolean = false;
    var breakEx = {};
    try {
        winCombinations.forEach(function (winCombination: number[]) {
            var count = 0;
            winCombination.forEach(function (index) {
                if (points[index].userData.claim == color)
                    count++;
            })
            if (count === sceneData.pointNumber) {
                won = true;
                throw breakEx;
            }
        })
    } catch (ex) {
        if (ex != breakEx) throw ex;
    }
    return won;
}

function aiMove() {
    let moved: boolean = false
    var movedEx = {}

    // offensive move (finish game)
    try {
        winCombinations.forEach(function (winCombination) {
            const counts = countClaims(winCombination);
            if ((counts["red"] === sceneData.pointNumber - 1) && (counts["green"] === 0)) {
                winCombination.forEach(function (index) {
                    if (points[index].userData.claim == UNCLAIMED) {
                        points[index].userData.claim = RED;
                        (points[index].material as any).color.setHex(0xff0000);
                    }
                });
                moved = true;
                throw movedEx;
            }
        })
    } catch (ex) {
        if (ex != movedEx) throw ex;
    }
    if (moved) return;

    try {
        // defensive move
        winCombinations.forEach(function (winCombination) {
            var counts = countClaims(winCombination);
            if ((countClaims(winCombination)["green"] === sceneData.pointNumber - 1) && (counts["red"] === 0)) {
                winCombination.forEach(function (index) {
                    if (points[index].userData.claim == UNCLAIMED) {
                        points[index].userData.claim = RED;
                        (points[index].material as any).color.setHex(0xff0000);
                    }
                });
                moved = true;
                throw movedEx;
            }
        });
    } catch (ex) {
        if (ex != movedEx) throw ex;
    }

    if (moved) return;

    // random move
    const preferredIndexes: number[] = [13, 16, 10, 3, 4, 5, 21, 22, 23, 12, 14];
    try {
        preferredIndexes.forEach(function (index) {
            if (points[index].userData.claim == UNCLAIMED) {
                points[index].userData.claim = RED;
                (points[index].material as any).color.setHex(0xff0000);
                moved = true;
                throw movedEx;
            }
        });

        // all the preferred are taken, just take first unclaimed
        points.forEach(function (point) {
            if (point.userData.claim == UNCLAIMED) {
                point.userData.claim = RED;
                (point.material as any).color.setHex(0xff0000);
                moved = true;
                throw movedEx;
            }
        });
    } catch (ex) {
        if (ex != movedEx) throw ex;
    }
}

// count number of claimed points in a win combination for each color
function countClaims(winCombination: number[]) {
    let redCount: number = 0
    let greenCount: number = 0

    winCombination.forEach(function (index) {
        if (points[index].userData.claim == RED) {
            redCount++;
        }
        if (points[index].userData.claim == GREEN) {
            greenCount++;
        }
    });

    return { "red": redCount, "green": greenCount };
}

// @param color: just finished its turn
function changeTurn(previousColor: number) {
    if (checkWin(previousColor)) {
        // gameOver = true;
        console.log(`${previousColor} won`)
        resetGame()
    } else {
        currentTurn = ((currentTurn == RED) ? GREEN : RED);
        console.log(`${currentTurn} turn`)
        if (currentTurn == RED && vsAi == true) {
            aiMove()
            changeTurn(RED)
        }
    }
}

/* EVENTS */
window.addEventListener('click', selectPoint, false);
function selectPoint(event: MouseEvent) {

    const intersectObjects: THREE.Intersection[] = getIntersectObjects(event)
    if (intersectObjects.length) {
        const selectedPoint = intersectObjects[0].object as THREE.Mesh
        if (selectedPoint.userData.claim != RED && selectedPoint.userData.claim != GREEN) {
            (selectedPoint.material as any).color.setHex((currentTurn == RED) ? 0xff0000 : 0x00ff00);
            selectedPoint.userData.claim = currentTurn
            changeTurn(currentTurn);
        }
    }
}

let hoveredPoint: THREE.Mesh | null
window.addEventListener('mousemove', hoverPoint, false)
function hoverPoint(event: MouseEvent) {
    const intersectObjects: THREE.Intersection[] = getIntersectObjects(event)

    if (intersectObjects.length) {
        const currentHoveredPoint = intersectObjects[0].object as THREE.Mesh
        // no affect on claimed points
        if (currentHoveredPoint.userData.claim == RED || currentHoveredPoint.userData.claim == GREEN) return
        // if move to new unclaimed point
        if (hoveredPoint != currentHoveredPoint) {
            if (hoveredPoint)
                (hoveredPoint.material as any).emissive.setHex((hoveredPoint as any).currentHex);
            hoveredPoint = currentHoveredPoint;
            (hoveredPoint as any).currentHex = (hoveredPoint.material as any).emissive.getHex();
            // console.log(`Point id: ${hoveredPoint.userData.id}`)

            if (currentTurn == RED) {
                (hoveredPoint.material as any).emissive.setHex(0xff0000);
            } else if (currentTurn == GREEN) {
                (hoveredPoint.material as any).emissive.setHex(0x00ff00);
            }
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