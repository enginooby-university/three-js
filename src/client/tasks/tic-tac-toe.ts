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

let cage: THREE.LineSegments
const pointGeometry = new THREE.SphereGeometry(sceneData.pointRadius, sceneData.widthSegments, sceneData.heightSegments)
const points: THREE.Mesh[] = [];

const winCombinations: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14],
    [15, 16, 17], [18, 19, 20], [21, 22, 23], [24, 25, 26],
    [6, 15, 24], [7, 16, 25], [8, 17, 26], [3, 12, 21], [4, 13, 22],
    [5, 14, 23], [0, 9, 18], [1, 10, 19], [2, 11, 20],
    [18, 21, 24], [19, 22, 25], [20, 23, 26], [9, 12, 25], [10, 13, 16],
    [11, 14, 17], [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [6, 16, 26], [8, 16, 24], [3, 13, 23], [5, 13, 21], [0, 10, 20], [2, 10, 18],
    [18, 22, 26], [20, 22, 24], [2, 14, 26], [8, 10, 20], [2, 4, 6], [0, 4, 8],
    [0, 12, 24], [6, 12, 18], [2, 13, 24], [6, 13, 20], [0, 13, 26], [8, 13, 18],
    [11, 13, 15], [9, 13, 17], [1, 13, 25], [7, 13, 19]
];

export function init() {
    isInitialized = true
    scene.background = new THREE.Color(0x333333)

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
const MOVE_SPEED = 0.05
export function render() {
    points.forEach(point => {
        const targetX: number = point.userData.targetPosition.x
        const lowBoundX: number = targetX - MOVE_SPEED
        const highBoundX: number = targetX + MOVE_SPEED
        if (point.position.x != targetX) {
            if (point.position.x < lowBoundX) {
                point.position.x += MOVE_SPEED
            } else if (highBoundX < point.position.x) {
                point.position.x -= MOVE_SPEED
            } else {
                point.position.x = targetX
            }
        }

        const targetY: number = point.userData.targetPosition.y
        const lowBoundY: number = targetY - MOVE_SPEED
        const highBoundY: number = targetY + MOVE_SPEED
        if (point.position.y != targetY) {
            if (point.position.y < lowBoundY) {
                point.position.y += MOVE_SPEED
            } else if (highBoundY < point.position.y) {
                point.position.y -= MOVE_SPEED
            } else {
                point.position.y = targetY
            }
        }

        const targetZ: number = point.userData.targetPosition.z
        const lowBoundZ: number = targetZ - MOVE_SPEED
        const highBoundZ: number = targetZ + MOVE_SPEED
        if (point.position.z != targetZ) {
            if (point.position.z < lowBoundZ) {
                point.position.z += MOVE_SPEED
            } else if (highBoundZ < point.position.z) {
                point.position.z -= MOVE_SPEED
            } else {
                point.position.z = targetZ
            }
        }
    })
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
        console.log(vsAi)
    })

    const pointsFolder: GUI = gui.addFolder("Points")
    pointsFolder.add(sceneData, "wireframe", false).onFinishChange(value => {
        points.forEach(point => (point.material as THREE.MeshPhysicalMaterial).wireframe = value)
    })
    pointsFolder.add(sceneData, "pointRadius", 0.5, 1, 0.1).name("Radius").onFinishChange(radius => {
        console.log(sceneData.pointRadius)
        points.forEach(point => {
            scene.remove(cage)
            createCage()
            point.scale.x = radius
            point.scale.y = radius
            point.scale.z = radius

            updatePointsPositions()
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
    const bars = new THREE.Geometry();
    const DISTANCE_FACTOR: number = 1.5 // number of points/2
    const R = sceneData.pointRadius

    bars.vertices.push(
        // x bars
        new THREE.Vector3(R * 4, R * 1.5, R * -1.5), new THREE.Vector3(R * -4, R * 1.5, R * -1.5),
        new THREE.Vector3(R * 4, R * 1.5, R * 1.5), new THREE.Vector3(R * -4, R * 1.5, R * 1.5),
        new THREE.Vector3(R * 4, R * -1.5, R * -1.5), new THREE.Vector3(R * -4, R * -1.5, R * -1.5),
        new THREE.Vector3(R * 4, R * -1.5, R * 1.5), new THREE.Vector3(R * -4, R * -1.5, R * 1.5),

        // y bars
        new THREE.Vector3(R * 1.5, R * 4, R * 1.5), new THREE.Vector3(R * 1.5, -R * 4, R * 1.5),
        new THREE.Vector3(R * 1.5, R * 4, R * -1.5), new THREE.Vector3(R * 1.5, -R * 4, R * -1.5),
        new THREE.Vector3(R * -1.5, R * 4, R * 1.5), new THREE.Vector3(R * -1.5, -R * 4, R * 1.5),
        new THREE.Vector3(R * -1.5, R * 4, R * -1.5), new THREE.Vector3(R * -1.5, -R * 4, R * -1.5),

        // z bars
        new THREE.Vector3(R * 1.5, R * 1.5, R * 4), new THREE.Vector3(R * 1.5, R * 1.5, -R * 4),
        new THREE.Vector3(R * -1.5, R * 1.5, R * 4), new THREE.Vector3(R * -1.5, R * 1.5, -R * 4),
        new THREE.Vector3(R * 1.5, R * -1.5, R * 4), new THREE.Vector3(R * 1.5, R * -1.5, -R * 4),
        new THREE.Vector3(R * -1.5, R * -1.5, R * 4), new THREE.Vector3(R * -1.5, R * -1.5, -R * 4),
    );
    cage = new THREE.LineSegments(bars, new THREE.LineBasicMaterial(), THREE.LinePieces);
    scene.add(cage);
}

function createPoints() {
    const range: number[] = [-sceneData.pointRadius * 3, 0, sceneData.pointRadius * 3];
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

function updatePointsPositions() {
    const range: number[] = [sceneData.pointRadius * -3, 0, sceneData.pointRadius * 3];
    let index: number = 0;
    range.forEach(function (x) {
        range.forEach(function (y) {
            range.forEach(function (z) {
                (points[index++].userData.targetPosition as THREE.Vector3).set(x, y, z)
                // points[index++].position.set(x, y, z);
            })
        })
    });
}

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
            if (count === 3) {
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

    // offensive move
    try {
        winCombinations.forEach(function (winCombination) {
            const counts = countClaims(winCombination);
            if ((counts["red"] === 2) && (counts["green"] === 0)) {
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
            if ((countClaims(winCombination)["green"] === 2) && (counts["red"] === 0)) {
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
            console.log(`Point id: ${hoveredPoint.userData.id}`)

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