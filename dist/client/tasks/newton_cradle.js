import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
import { transformControls, attachToDragControls, muted, raycaster } from '../client.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox;
let texture_ft;
let texture_bk;
let texture_up;
let texture_dn;
let texture_rt;
let texture_lf;
let materialArray;
let Data = {
    Skybox: "arid",
    VerBallAmount: 5,
    VerBallSpeed: 3,
    VerBallMaxAngle: 40,
    HorBallAmount: 3,
    HorBallSpeed: 5,
    HorBallMaxAngle: 60,
};
const options = {
    skybox: {
        "Arid": "arid",
        "Cocoa": "cocoa",
        "Dust": "dust",
    }
};
let cradle; // including balls, ropes
let verBallAmount = 5;
let horBallAmount = 3;
const BALL_RADIUS = 0.5;
const sphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
const ballMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 1,
    roughness: 0.6,
    transparent: true
});
let firstVerBall; // in vertical group
let lastVerBall;
let firstHorBall;
let lastHorBall;
const barGeometry = new THREE.BoxGeometry(10, 0.2, 0.2);
const barMaterial = new THREE.MeshPhysicalMaterial({});
const directionalLight = new THREE.DirectionalLight();
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
let plane;
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
const ROPE_LENGHT = 3.5;
const ROPE_TO_FLOOR = 5;
let firstVerRope;
let lastVerRope;
let firstHorRope;
let lastHorRope;
const ropeGeometry = new THREE.CylinderGeometry(0.03, 0.03, ROPE_LENGHT);
const ropeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000 });
let rotateSpeedVerBall = 0.03;
let maxAngleVerBall = 40 * Math.PI / 180;
let rotateSpeedHorBall = 0.05;
let maxAngleHorBall = 60 * Math.PI / 180;
let firstVerRopeRotateVel;
let lastVerRopeRotateVel;
let firstHorRopeRotateVel;
let lastHorRopeRotateVel;
const audioListener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
let ballAudio;
// group of objects affected by DragControls & TransformControls
let transformableObjects = [];
// groups of objects which will be recreated on desire (e.g change in Dat GUI)
let balls = [];
let ropes = [];
export function init() {
    isInitialized = true;
    // change ropes' origin (pivot) for rotation
    ropeGeometry.translate(0, -ROPE_LENGHT / 2, 0);
    generateSkybox();
    //createCralde(verBallAmount, horBallAmount)
    createBalls(verBallAmount, horBallAmount);
    createRopes(verBallAmount, horBallAmount);
    createBars();
    createLight();
    createFloor();
    ballAudio = new THREE.PositionalAudio(audioListener);
    audioLoader.load('./resources/audio/ball-collision.wav', function (buffer) {
        ballAudio.setBuffer(buffer);
        ballAudio.duration = 0.4;
    });
    // scene.add(audioListener)
    setupControls();
    transformableObjects.forEach(child => scene.add(child));
}
export function setupControls() {
    attachToDragControls(transformableObjects);
    transformControls.detach();
    scene.add(transformControls);
}
export function createDatGUI() {
    gui = new GUI();
    gui.add(Data, 'Skybox', options.skybox).onChange(() => generateSkybox());
    const verticalGroupFolder = gui.addFolder('Vertical group');
    verticalGroupFolder.add(Data, 'VerBallAmount', 3, 10, 1).name('Ball number').onChange(() => {
        verBallAmount = Data.VerBallAmount;
        updateBallNumber();
    });
    verticalGroupFolder.add(Data, 'VerBallSpeed', 1, 10, 1).name('Ball speed').onChange(() => {
        rotateSpeedVerBall = Data.VerBallSpeed / 100;
    });
    verticalGroupFolder.add(Data, 'VerBallMaxAngle', 10, 70, 1).name('Max angle').onChange(() => {
        maxAngleVerBall = Data.VerBallMaxAngle * Math.PI / 180;
    });
    verticalGroupFolder.open();
    const horizontalGroupFolder = gui.addFolder('Horizontal group');
    horizontalGroupFolder.add(Data, 'HorBallAmount', 3, 10, 1).name('Ball number').onChange(() => {
        horBallAmount = Data.HorBallAmount;
        updateBallNumber();
    });
    horizontalGroupFolder.add(Data, 'HorBallSpeed', 1, 10, 1).name('Ball speed').onChange(() => {
        rotateSpeedHorBall = Data.HorBallSpeed / 100;
    });
    horizontalGroupFolder.add(Data, 'HorBallMaxAngle', 10, 70, 1).name('Max angle').onChange(() => {
        maxAngleHorBall = Data.HorBallMaxAngle * Math.PI / 180;
    });
    horizontalGroupFolder.open();
    DatHelper.createDirectionalLightFolder(gui, directionalLight);
    const ballFolder = gui.addFolder("Balls");
    DatHelper.createPhysicalMaterialFolder(ballFolder, ballMaterial).open();
    const ropeFolder = gui.addFolder("Ropes");
    DatHelper.createPhysicalMaterialFolder(ropeFolder, ropeMaterial).open();
    const barFolder = gui.addFolder("Bars");
    DatHelper.createPhysicalMaterialFolder(barFolder, barMaterial).open();
    const floorFolder = DatHelper.createObjectFolder(gui, plane, 'Floor');
    DatHelper.createMaterialFolder(floorFolder, planeMaterial).open();
}
export function render() {
    lightShadowHelper.update();
    const intersectObjects = raycaster.intersectObjects(transformableObjects, false);
    if (intersectObjects.length) {
        transformControls.attach(intersectObjects[0].object);
    }
    // when last ball&rope is staying
    if (lastVerRopeRotateVel == 0) {
        if (firstVerRope.rotation.z >= 0) {
            playBallAudio();
            firstVerRopeRotateVel = 0;
            firstVerRope.rotation.z = 0;
            lastVerRopeRotateVel = rotateSpeedVerBall;
        }
        if (firstVerRope.rotation.z <= -maxAngleVerBall) {
            firstVerRopeRotateVel = rotateSpeedVerBall;
        }
        // when first ball&rope is staying
    }
    else if (firstVerRopeRotateVel == 0) {
        if (lastVerRope.rotation.z <= 0) {
            playBallAudio();
            firstVerRopeRotateVel = -rotateSpeedVerBall;
            lastVerRope.rotation.z = 0;
            lastVerRopeRotateVel = 0;
        }
        if (lastVerRope.rotation.z >= maxAngleVerBall) {
            lastVerRopeRotateVel = -rotateSpeedVerBall;
        }
    }
    // when last ball&rope is staying
    if (lastHorRopeRotateVel == 0) {
        if (firstHorRope.rotation.x <= 0) {
            playBallAudio();
            firstHorRopeRotateVel = 0;
            firstHorRope.rotation.x = 0;
            lastHorRopeRotateVel = -rotateSpeedHorBall;
        }
        if (firstHorRope.rotation.x >= maxAngleHorBall) {
            firstHorRopeRotateVel = -rotateSpeedHorBall;
        }
        // when first ball&rope is staying
    }
    else if (firstHorRopeRotateVel == 0) {
        if (lastHorRope.rotation.x >= 0) {
            playBallAudio();
            firstHorRopeRotateVel = rotateSpeedHorBall;
            lastHorRope.rotation.x = 0;
            lastHorRopeRotateVel = 0;
        }
        if (lastHorRope.rotation.x <= -maxAngleHorBall) {
            lastHorRopeRotateVel = rotateSpeedHorBall;
        }
    }
    // update first and last rope rotations
    firstVerRope.rotation.z += firstVerRopeRotateVel;
    lastVerRope.rotation.z += lastVerRopeRotateVel;
    firstHorRope.rotation.x += firstHorRopeRotateVel;
    lastHorRope.rotation.x += lastHorRopeRotateVel;
    // update first and last ball positions
    firstVerBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(firstVerRope.rotation.z) + BALL_RADIUS * (1 - verBallAmount + 2 * 0); // original x of first ver ball
    firstVerBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstVerRope.rotation.z);
    lastVerBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(lastVerRope.rotation.z) + BALL_RADIUS * (1 - verBallAmount + 2 * (verBallAmount - 1)); // original x of last ver ball
    lastVerBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastVerRope.rotation.z);
    firstHorBall.position.z = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(-firstHorRope.rotation.x) + BALL_RADIUS * (1 - horBallAmount + 2 * 0); // original z of first hor ball
    firstHorBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstHorRope.rotation.x);
    lastHorBall.position.z = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(-lastHorRope.rotation.x) + BALL_RADIUS * (1 - horBallAmount + 2 * (horBallAmount - 1)); // original z of last hor ball
    lastHorBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastHorRope.rotation.x);
}
function updateBallNumber() {
    // clear objects
    balls.forEach(ball => {
        // remove all balls in transformable group
        transformableObjects = transformableObjects.filter(object => object !== ball);
        scene.remove(ball);
        balls = [];
    });
    ropes.forEach(rope => {
        // remove all ropes in transformable group
        transformableObjects = transformableObjects.filter(object => object !== rope);
        scene.remove(rope);
        ropes = [];
    });
    createBalls(verBallAmount, horBallAmount);
    createRopes(verBallAmount, horBallAmount);
    // add objects
    balls.forEach(ball => scene.add(ball));
    ropes.forEach(rope => scene.add(rope));
    setupControls();
}
function playBallAudio() {
    if (!muted) {
        if (ballAudio.isPlaying) {
            ballAudio.stop();
        }
        ballAudio.play();
    }
}
function createLight() {
    directionalLight.position.set(4.5, 21, 13);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.rotation.x = Math.PI / 2;
    scene.add(directionalLight);
    scene.add(directionalLightHelper);
    scene.add(lightShadowHelper);
}
function createFloor() {
    planeMaterial.transparent = true;
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    transformableObjects.push(plane);
    scene.add(plane);
}
function createBalls(verAmount, horAmount) {
    for (let i = 0; i < verAmount; i++) {
        const xVerBall = BALL_RADIUS * (1 - verAmount + 2 * i);
        const newVerBall = createBall(xVerBall, 1, 0);
        if (i == 0) {
            firstVerBall = newVerBall;
        }
        if (i == verAmount - 1) {
            lastVerBall = newVerBall;
        }
    }
    for (let i = 0; i < horAmount; i++) {
        const zHorBall = BALL_RADIUS * (1 - horAmount + 2 * i);
        const newHorBall = createBall(0, 1, zHorBall);
        if (i == 0) {
            firstHorBall = newHorBall;
        }
        if (i == horAmount - 1) {
            lastHorBall = newHorBall;
        }
    }
}
function createBall(x, y, z) {
    const newBall = new THREE.Mesh(sphereGeometry, ballMaterial);
    newBall.position.set(x, y, z);
    newBall.castShadow = true;
    transformableObjects.push(newBall);
    balls.push(newBall);
    return newBall;
}
function createRopes(verAmount, horAmount) {
    // create ropes in vertical group
    for (let i = 0; i < verAmount; i++) {
        const xVerRope = BALL_RADIUS * (1 - verAmount + 2 * i);
        const newRope = createRope(xVerRope, ROPE_TO_FLOOR, 0);
        if (i == 0) {
            firstVerRope = newRope;
        }
        if (i == verAmount - 1) {
            lastVerRope = newRope;
        }
    }
    // create ropes in horizontal group
    for (let i = 0; i < horAmount; i++) {
        const zHorRope = BALL_RADIUS * (1 - horAmount + 2 * i);
        const newRope = createRope(0, ROPE_TO_FLOOR, zHorRope);
        if (i == 0) {
            firstHorRope = newRope;
        }
        if (i == horAmount - 1) {
            lastHorRope = newRope;
        }
    }
    // init rotations
    firstVerRope.rotation.z = -maxAngleVerBall; // firstVerRope = ropes[0]
    firstVerRopeRotateVel = rotateSpeedVerBall;
    lastVerRopeRotateVel = 0;
    firstHorRope.rotation.x = maxAngleVerBall; // firstHorRope = ropes[verAmount]
    firstHorRopeRotateVel = -rotateSpeedVerBall;
    lastHorRopeRotateVel = 0;
}
function createRope(x, y, z) {
    ropeMaterial.transparent = true;
    const newRope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    newRope.position.set(x, y, z);
    newRope.castShadow = true;
    transformableObjects.push(newRope);
    ropes.push(newRope);
    return newRope;
}
function createBars() {
    const horizontalBarGroup = new THREE.Group();
    barMaterial.metalness = 1;
    barMaterial.roughness = 0.6;
    barMaterial.transparent = true;
    horizontalBarGroup.add(createBar(0, 5, 0));
    const horizontalLeftBar = createBar(0, 5, 0);
    horizontalLeftBar.rotation.y = Math.PI / 2;
    horizontalLeftBar.scale.x = 0.42;
    horizontalLeftBar.position.x = -4.90;
    horizontalBarGroup.add(horizontalLeftBar);
    const horizontalRightBar = horizontalLeftBar.clone();
    horizontalRightBar.position.x = 4.90;
    horizontalBarGroup.add(horizontalRightBar);
    const verticalBar = createBar(0, 0, 0);
    verticalBar.rotation.z = Math.PI / 2;
    verticalBar.position.y = 2.5;
    verticalBar.scale.x = 0.5;
    const leftBar1 = verticalBar.clone();
    leftBar1.position.x = -4.90;
    leftBar1.position.z = -2;
    horizontalBarGroup.add(leftBar1);
    const leftBar2 = verticalBar.clone();
    leftBar2.position.x = -4.90;
    leftBar2.position.z = 2;
    horizontalBarGroup.add(leftBar2);
    const rightBar1 = verticalBar.clone();
    rightBar1.position.x = 4.90;
    rightBar1.position.z = -2;
    horizontalBarGroup.add(rightBar1);
    const rightBar2 = verticalBar.clone();
    rightBar2.position.x = 4.90;
    rightBar2.position.z = 2;
    horizontalBarGroup.add(rightBar2);
    horizontalBarGroup.children.forEach((child) => {
        transformableObjects.push(child);
    });
    const verticalBarGroup = horizontalBarGroup.clone();
    verticalBarGroup.rotation.y = Math.PI / 2;
    // TODO: verticalBarGroup rotatation by it origin when push this way
    // verticalBarGroup.children.forEach((child) => {
    //     transformableObjects.push(<THREE.Mesh>child)
    // })
    scene.add(verticalBarGroup);
}
function createBar(x, y, z) {
    const newBar = new THREE.Mesh(barGeometry, barMaterial);
    newBar.position.set(x, y, z);
    newBar.castShadow = true;
    return newBar;
}
function generateSkybox() {
    loadTextures();
    loadMaterials();
    skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.remove(skybox);
    scene.add(skybox);
}
function loadMaterials() {
    materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));
    for (let i = 0; i < materialArray.length; i++) {
        materialArray[i].side = THREE.BackSide;
    }
}
function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath('ft'));
    texture_bk = new THREE.TextureLoader().load(getTexturePath('bk'));
    texture_up = new THREE.TextureLoader().load(getTexturePath('up'));
    texture_dn = new THREE.TextureLoader().load(getTexturePath('dn'));
    texture_rt = new THREE.TextureLoader().load(getTexturePath('rt'));
    texture_lf = new THREE.TextureLoader().load(getTexturePath('lf'));
}
function getTexturePath(texturePosition) {
    return `./resources/textures/${Data.Skybox}/${Data.Skybox}_${texturePosition}.jpg`;
}
