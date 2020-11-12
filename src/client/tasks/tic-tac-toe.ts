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

const UNCLAIMED: number = 0
const RED: number = 1
const GREEN: number = 2
let mouseClicked: boolean = false
// const mouse = { x: 0, y: 0, clicked: false };
let currentTurn: number = RED
var gameOver: boolean = false;

const pointGeometry = new THREE.SphereGeometry(0.3, 25, 25)
const points: THREE.Mesh[] = [];
let selectedPoint: THREE.Mesh
const point = new THREE.Mesh(pointGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));

const winCombinations: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17],
    [18, 19, 20], [21, 22, 23], [24, 25, 26],
    [6, 15, 24], [7, 16, 25], [8, 17, 26], [3, 12, 21], [4, 13, 22], [5, 14, 23],
    [0, 9, 18], [1, 10, 19], [2, 11, 20],
    [18, 21, 24], [19, 22, 25], [20, 23, 26], [9, 12, 25], [10, 13, 16], [11, 14, 17],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
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
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

// const clock: THREE.Clock = new THREE.Clock()
export function render() {
    // updateControls()
}

function createLights() {
    const light = new THREE.DirectionalLight(0xe0e0e0);
    light.position.set(5, 2, 5).normalize();

    scene.add(light)
    scene.add(new THREE.AmbientLight(0x101010));
}

function createDatGUI() {
    gui = new GUI()
}

function createCage() {
    const base = new THREE.Geometry();
    for (var z = -1; z < 1; z++) {
        base.vertices.push(
            new THREE.Vector3(0, 0, z), new THREE.Vector3(3, 0, z),
            new THREE.Vector3(0, 1, z), new THREE.Vector3(3, 1, z),
            new THREE.Vector3(1, 2, z), new THREE.Vector3(1, -1, z),
            new THREE.Vector3(2, 2, z), new THREE.Vector3(2, -1, z)
        );
    }
    for (var x = 1; x < 3; x++) {
        base.vertices.push(
            new THREE.Vector3(x, 1, 1), new THREE.Vector3(x, 1, -2),
            new THREE.Vector3(x, 0, 1), new THREE.Vector3(x, 0, -2)
        );
    }
    var cage = new THREE.LineSegments(base, new THREE.LineBasicMaterial(), THREE.LinePieces);
    cage.position.set(-1.5, -0.5, 0.5);
    scene.add(cage);
}

function createPoints() {
    const range: number[] = [-1, 0, 1];
    let index: number = 0;
    range.forEach(function (x) {
        range.forEach(function (y) {
            range.forEach(function (z) {
                var point = new THREE.Mesh(pointGeometry, new THREE.MeshPhongMaterial({ color: 0xffffff }));
                point.userData.id = index++
                point.userData.claim = UNCLAIMED;
                points.push(point);

                point.position.set(x, y, z);
                // transformableObjects.push(point)
                scene.add(point);
            })
        })
    });

}

function resetGame() {
    points.forEach(function (point) {
        point.userData.claim = UNCLAIMED;
        (point.material as any).color.setHex(0xffffff);
        currentTurn = ((currentTurn == RED) ? GREEN : RED);
    });
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
                // won
                won = true;
                throw breakEx;
            }
        })
    } catch (ex) {
        if (ex != breakEx) throw ex;
    }
    return won;
}


function countClaim(comb: number[]) { //??
    let redCount: number = 0
    let greenCount: number = 0

    comb.forEach(function (index) {
        if (points[index].userData.claim == RED) {
            redCount++;
        }
        if (points[index].userData.claim == GREEN) {
            greenCount++;
        }
    });

    return { "red": redCount, "green": greenCount };
}

function changeTurn(color: number) {
    if (checkWin(color)) {
        gameOver = true;
    } else {
        currentTurn = ((currentTurn == RED) ? GREEN : RED);
    }

    console.log(`Turn ${currentTurn}`)
}


window.addEventListener('click', selectPoint, false);
function selectPoint(event: MouseEvent) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera)
    const intersectObjects: THREE.Intersection[] = raycaster.intersectObjects(points, false)
    if (gameOver) {
        resetGame()
        gameOver = false
        mouseClicked = false
        return
    }
    if (intersectObjects.length) {
        const selectedPoint = intersectObjects[0].object as THREE.Mesh
        console.log(selectedPoint.userData.claim)
        if (selectedPoint.userData.claim != RED && selectedPoint.userData.claim != GREEN) {
            (selectedPoint.material as any).color.setHex((currentTurn == RED) ? 0xff0000 : 0x00ff00);
            selectedPoint.userData.claim = currentTurn
            changeTurn(currentTurn);
        }
    }
}


function updateControls() {
    if (!(gameOver) && (currentTurn === RED)) {
        // redComputerMove();
        changeTurn(RED);
        return;
    }
}