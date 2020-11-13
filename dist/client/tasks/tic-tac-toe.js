import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as THREE from '/build/three.module.js';
import { raycaster, mouse, camera, transformControls, attachToDragControls } from '../client.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
export let skybox = 'dust';
export const setSkybox = (name) => skybox = name;
// group of objects affected by DragControls & TransformControls
export let transformableObjects = [];
export let selectedObjectId = -1;
export const setSelectedObjectId = (index) => selectedObjectId = index;
const UNCLAIMED = 0;
const RED = 1;
const GREEN = 2;
let currentTurn = RED;
let vsAi = true; // RED
var gameOver = false;
const POINT_RADIUS = 1;
const pointGeometry = new THREE.SphereGeometry(POINT_RADIUS, 25, 25);
const points = [];
const winCombinations = [
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
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
    createLights();
    createCage();
    createPoints();
    setupControls();
    createDatGUI();
    transformableObjects.forEach(child => {
        scene.add(child);
    });
    // start game
    if (currentTurn == RED && vsAi == true) {
        aiMove();
        changeTurn(RED);
    }
}
export function setupControls() {
    attachToDragControls(transformableObjects);
    transformControls.detach();
    // add to scene to display helpers
    scene.add(transformControls);
}
// const clock: THREE.Clock = new THREE.Clock()
export function render() {
}
function createLights() {
    const light = new THREE.DirectionalLight(0xe0e0e0);
    light.position.set(5, 2, 5).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x101010));
}
function createDatGUI() {
    const gameModes = {
        "Play with AI": true,
        "Local multi-player": false,
    };
    const selectedGameMode = {
        vsAi: true
    };
    gui = new GUI();
    gui.add(selectedGameMode, "vsAi", gameModes).name("Game mode").onChange(value => {
        vsAi = value;
        console.log(vsAi);
    });
}
function createCage() {
    const bars = new THREE.Geometry();
    const DISTANCE_FACTOR = 1.5; // number of points/2
    bars.vertices.push(
    // x bars
    new THREE.Vector3(4 * POINT_RADIUS, POINT_RADIUS * 1.5, POINT_RADIUS * -1.5), new THREE.Vector3(4 * -POINT_RADIUS, POINT_RADIUS * 1.5, POINT_RADIUS * -1.5), new THREE.Vector3(4 * POINT_RADIUS, POINT_RADIUS * 1.5, POINT_RADIUS * 1.5), new THREE.Vector3(4 * -POINT_RADIUS, POINT_RADIUS * 1.5, POINT_RADIUS * 1.5), new THREE.Vector3(4 * POINT_RADIUS, POINT_RADIUS * -1.5, POINT_RADIUS * -1.5), new THREE.Vector3(4 * -POINT_RADIUS, POINT_RADIUS * -1.5, POINT_RADIUS * -1.5), new THREE.Vector3(4 * POINT_RADIUS, POINT_RADIUS * -1.5, POINT_RADIUS * 1.5), new THREE.Vector3(4 * -POINT_RADIUS, POINT_RADIUS * -1.5, POINT_RADIUS * 1.5), 
    // y bars
    new THREE.Vector3(POINT_RADIUS * 1.5, 4 * POINT_RADIUS, POINT_RADIUS * 1.5), new THREE.Vector3(POINT_RADIUS * 1.5, -4 * POINT_RADIUS, POINT_RADIUS * 1.5), new THREE.Vector3(POINT_RADIUS * 1.5, 4 * POINT_RADIUS, POINT_RADIUS * -1.5), new THREE.Vector3(POINT_RADIUS * 1.5, -4 * POINT_RADIUS, POINT_RADIUS * -1.5), new THREE.Vector3(POINT_RADIUS * -1.5, 4 * POINT_RADIUS, POINT_RADIUS * 1.5), new THREE.Vector3(POINT_RADIUS * -1.5, -4 * POINT_RADIUS, POINT_RADIUS * 1.5), new THREE.Vector3(POINT_RADIUS * -1.5, 4 * POINT_RADIUS, POINT_RADIUS * -1.5), new THREE.Vector3(POINT_RADIUS * -1.5, -4 * POINT_RADIUS, POINT_RADIUS * -1.5), 
    // z bars
    new THREE.Vector3(POINT_RADIUS * 1.5, POINT_RADIUS * 1.5, 4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * 1.5, POINT_RADIUS * 1.5, -4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * -1.5, POINT_RADIUS * 1.5, 4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * -1.5, POINT_RADIUS * 1.5, -4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * 1.5, POINT_RADIUS * -1.5, 4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * 1.5, POINT_RADIUS * -1.5, -4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * -1.5, POINT_RADIUS * -1.5, 4 * POINT_RADIUS), new THREE.Vector3(POINT_RADIUS * -1.5, POINT_RADIUS * -1.5, -4 * POINT_RADIUS));
    var cage = new THREE.LineSegments(bars, new THREE.LineBasicMaterial(), THREE.LinePieces);
    scene.add(cage);
}
function createPoints() {
    const range = [-POINT_RADIUS * 3, 0, POINT_RADIUS * 3];
    let index = 0;
    range.forEach(function (x) {
        range.forEach(function (y) {
            range.forEach(function (z) {
                var point = new THREE.Mesh(pointGeometry, new THREE.MeshPhongMaterial({ color: 0xffffff }));
                point.userData.id = index++;
                point.userData.claim = UNCLAIMED;
                points.push(point);
                point.position.set(x, y, z);
                // transformableObjects.push(point)
                scene.add(point);
            });
        });
    });
}
function resetGame() {
    points.forEach(function (point) {
        point.userData.claim = UNCLAIMED;
        point.material.color.setHex(0xffffff);
    });
    // loser in previous game goes first in new game
    currentTurn = ((currentTurn == RED) ? GREEN : RED);
    // TODO: refactor duplication
    if (currentTurn == RED && vsAi == true) {
        aiMove();
        changeTurn(RED);
    }
}
function checkWin(color) {
    let won = false;
    var breakEx = {};
    try {
        winCombinations.forEach(function (winCombination) {
            var count = 0;
            winCombination.forEach(function (index) {
                if (points[index].userData.claim == color)
                    count++;
            });
            if (count === 3) {
                won = true;
                throw breakEx;
            }
        });
    }
    catch (ex) {
        if (ex != breakEx)
            throw ex;
    }
    return won;
}
function aiMove() {
    let moved = false;
    var movedEx = {};
    // offensive move
    try {
        winCombinations.forEach(function (winCombination) {
            const counts = countClaims(winCombination);
            if ((counts["red"] === 2) && (counts["green"] === 0)) {
                winCombination.forEach(function (index) {
                    if (points[index].userData.claim == UNCLAIMED) {
                        points[index].userData.claim = RED;
                        points[index].material.color.setHex(0xff0000);
                    }
                });
                moved = true;
                throw movedEx;
            }
        });
    }
    catch (ex) {
        if (ex != movedEx)
            throw ex;
    }
    if (moved)
        return;
    try {
        // defensive move
        winCombinations.forEach(function (winCombination) {
            var counts = countClaims(winCombination);
            if ((countClaims(winCombination)["green"] === 2) && (counts["red"] === 0)) {
                winCombination.forEach(function (index) {
                    if (points[index].userData.claim == UNCLAIMED) {
                        points[index].userData.claim = RED;
                        points[index].material.color.setHex(0xff0000);
                    }
                });
                moved = true;
                throw movedEx;
            }
        });
    }
    catch (ex) {
        if (ex != movedEx)
            throw ex;
    }
    if (moved)
        return;
    // random move
    const preferredIndexes = [13, 16, 10, 3, 4, 5, 21, 22, 23, 12, 14];
    try {
        preferredIndexes.forEach(function (index) {
            if (points[index].userData.claim == UNCLAIMED) {
                points[index].userData.claim = RED;
                points[index].material.color.setHex(0xff0000);
                moved = true;
                throw movedEx;
            }
        });
        // all the preferred are taken, just take first unclaimed
        points.forEach(function (point) {
            if (point.userData.claim == UNCLAIMED) {
                point.userData.claim = RED;
                point.material.color.setHex(0xff0000);
                moved = true;
                throw movedEx;
            }
        });
    }
    catch (ex) {
        if (ex != movedEx)
            throw ex;
    }
}
// count number of claimed points in a win combination for each color
function countClaims(winCombination) {
    let redCount = 0;
    let greenCount = 0;
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
function changeTurn(previousColor) {
    if (checkWin(previousColor)) {
        // gameOver = true;
        console.log(`${previousColor} won`);
        resetGame();
    }
    else {
        currentTurn = ((currentTurn == RED) ? GREEN : RED);
        console.log(`${currentTurn} turn`);
        if (currentTurn == RED && vsAi == true) {
            aiMove();
            changeTurn(RED);
        }
    }
}
/* EVENTS */
window.addEventListener('click', selectPoint, false);
function selectPoint(event) {
    const intersectObjects = getIntersectObjects(event);
    if (intersectObjects.length) {
        const selectedPoint = intersectObjects[0].object;
        if (selectedPoint.userData.claim != RED && selectedPoint.userData.claim != GREEN) {
            selectedPoint.material.color.setHex((currentTurn == RED) ? 0xff0000 : 0x00ff00);
            selectedPoint.userData.claim = currentTurn;
            changeTurn(currentTurn);
        }
    }
}
let hoveredPoint;
window.addEventListener('mousemove', hoverPoint, false);
function hoverPoint(event) {
    const intersectObjects = getIntersectObjects(event);
    if (intersectObjects.length) {
        const currentHoveredPoint = intersectObjects[0].object;
        // no affect on claimed points
        if (currentHoveredPoint.userData.claim == RED || currentHoveredPoint.userData.claim == GREEN)
            return;
        // if move to new unclaimed point
        if (hoveredPoint != currentHoveredPoint) {
            if (hoveredPoint)
                hoveredPoint.material.emissive.setHex(hoveredPoint.currentHex);
            hoveredPoint = currentHoveredPoint;
            hoveredPoint.currentHex = hoveredPoint.material.emissive.getHex();
            if (currentTurn == RED) {
                hoveredPoint.material.emissive.setHex(0xff0000);
            }
            else if (currentTurn == GREEN) {
                hoveredPoint.material.emissive.setHex(0x00ff00);
            }
        }
    }
    else {
        if (hoveredPoint)
            hoveredPoint.material.emissive.setHex(hoveredPoint.currentHex);
        hoveredPoint = null;
    }
}
function getIntersectObjects(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(points, false);
}
