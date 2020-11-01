import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI

const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox: THREE.Mesh

let texture_ft: THREE.Texture
let texture_bk: THREE.Texture
let texture_up: THREE.Texture
let texture_dn: THREE.Texture
let texture_rt: THREE.Texture
let texture_lf: THREE.Texture

let materialArray: THREE.MeshBasicMaterial[]

let Data = {
    Skybox: "arid",
    BallAmount: 5,
    BallSpeed: 3,
    MaxAngle: 40, // degree
}

const options = {
    skybox: {
        "Arid": "arid",
        "Cocoa": "cocoa",
        "Dust": "dust",
    }
}

let cradle: THREE.Group // including balls, ropes

let ballAmount: number = 5
const BALL_RADIUS: number = 0.5
const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64)
const ballMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({})
let firstBall: THREE.Mesh
let lastBall: THREE.Mesh

const barGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(10, 0.2, 0.2)
const barMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({})

const directionalLight = new THREE.DirectionalLight()
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

let plane: THREE.Mesh
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

const ROPE_LENGHT: number = 3.5
const ROPE_TO_FLOOR: number = 5
let firstRope: THREE.Mesh
let lastRope: THREE.Mesh
const ropeGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.03, 0.03, ROPE_LENGHT)
const ropeMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000 })

let rotateSpeed: number = 0.03
let maxAngle: number = 40 * Math.PI / 180
let firstRopeRotateVel: number
let lastRopeRotateVel: number

const audioListener: THREE.AudioListener = new THREE.AudioListener()
const audioLoader: THREE.AudioLoader = new THREE.AudioLoader()
let ballAudio: THREE.PositionalAudio

export function init() {
    isInitialized = true

    // change ropes' origin (pivot) for rotation
    ropeGeometry.translate(0, -ROPE_LENGHT / 2, 0)

    generateSkybox()
    createCralde(ballAmount)
    createBars()
    createLight()
    createFloor()

    ballAudio = new THREE.PositionalAudio(audioListener)
    audioLoader.load('./resources/audio/ball-collision.wav', function (buffer) {
        ballAudio.setBuffer(buffer);
        ballAudio.duration = 0.4
    })
    // scene.add(audioListener)

    setupControls()
}

export function setupControls(){
    attachToDragControls([cradle])
    transformControls.attach(cradle)
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    gui = new GUI()
    gui.add(Data, 'Skybox', options.skybox).onChange(() => generateSkybox())
    gui.add(Data, 'BallAmount', 3, 10, 1).name('Ball number').onChange(() => {
        ballAmount = Data.BallAmount;
        createCralde(ballAmount)
        setupControls()
    })
    gui.add(Data, 'BallSpeed', 1, 10, 1).name('Ball speed').onChange(() => {
        rotateSpeed = Data.BallSpeed / 100
    })
    gui.add(Data, 'MaxAngle', 10, 70, 1).name('Max angle').onChange(() => {
        maxAngle = Data.MaxAngle * Math.PI / 180
    })

    DatHelper.createDirectionalLightFolder(gui, directionalLight)
    const ballFolder: GUI = gui.addFolder("Balls")
    DatHelper.createPhysicalMaterialFolder(ballFolder, ballMaterial).open()
    const ropeFolder: GUI = gui.addFolder("Ropes")
    DatHelper.createPhysicalMaterialFolder(ropeFolder, ropeMaterial).open()
    const barFolder: GUI = gui.addFolder("Bars")
    DatHelper.createPhysicalMaterialFolder(barFolder, barMaterial).open()
    const floorFolder = DatHelper.createObjectFolder(gui, plane, 'Floor')
    DatHelper.createMaterialFolder(floorFolder, planeMaterial).open()
}

export function render() {
    lightShadowHelper.update()

    // when last ball&rope is staying
    if (lastRopeRotateVel == 0) {
        if (firstRope.rotation.z >= 0) {
            playBallAudio()
            firstRopeRotateVel = 0
            firstRope.rotation.z = 0
            lastRopeRotateVel = rotateSpeed
        }
        if (firstRope.rotation.z <= -maxAngle) {
            firstRopeRotateVel = rotateSpeed
        }

        // when first ball&rope is staying
    } else if (firstRopeRotateVel == 0) {
        if (lastRope.rotation.z <= 0) {
            playBallAudio()
            firstRopeRotateVel = -rotateSpeed
            lastRope.rotation.z = 0
            lastRopeRotateVel = 0
        }
        if (lastRope.rotation.z >= maxAngle) {
            lastRopeRotateVel = -rotateSpeed
        }
    }

    // update first and last rope rotations
    firstRope.rotation.z += firstRopeRotateVel
    lastRope.rotation.z += lastRopeRotateVel

    // update first and last ball positions
    firstBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(firstRope.rotation.z) + BALL_RADIUS * (1 - ballAmount + 2 * 0) // original x of first ball
    firstBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstRope.rotation.z)
    lastBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(lastRope.rotation.z) + BALL_RADIUS * (1 - ballAmount + 2 * (ballAmount - 1)) // original x of last ball
    lastBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastRope.rotation.z)
}

function playBallAudio() {
    if (!muted) {
        if (ballAudio.isPlaying) {
            ballAudio.stop()
        }
        ballAudio.play()
    }
}

function createLight() {
    directionalLight.position.set(4.5, 21, 13)
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.left = -5
    directionalLight.shadow.camera.right = 6
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.rotation.x = Math.PI / 2

    scene.add(directionalLight)
    scene.add(directionalLightHelper)
    scene.add(lightShadowHelper);
}

function createFloor() {
    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotateX(-Math.PI / 2)
    plane.position.y = -0.01
    plane.receiveShadow = true;
    scene.add(plane)
}

function createCralde(ballAmount: number) {
    scene.remove(cradle)
    const newCradle: THREE.Group = new THREE.Group()

    newCradle.add(createBalls(ballAmount))
    newCradle.add(createRopes(ballAmount))

    cradle = newCradle
    scene.add(cradle)
}

function createBalls(amount: number) {
    const balls: THREE.Group = new THREE.Group()
    ballMaterial.metalness = 1
    ballMaterial.roughness = 0.6
    ballMaterial.transparent = true

    for (let i = 0; i < amount; i++) {
        const xBall: number = BALL_RADIUS * (1 - amount + 2 * i)
        if (i == 0) {
            firstBall = createBall(xBall, 1, 0)
            balls.add(firstBall)
        } else if (i == amount - 1) {
            lastBall = createBall(xBall, 1, 0)
            balls.add(lastBall)
        } else {
            balls.add(createBall(xBall, 1, 0))
        }
    }

    return balls
}

function createBall(x: number, y: number, z: number) {
    const newBall: THREE.Mesh = new THREE.Mesh(sphereGeometry, ballMaterial)
    newBall.position.set(x, y, z)
    newBall.castShadow = true
    // scene.add(newBall)

    return newBall
}

function createRopes(amount: number) {
    const ropes: THREE.Group = new THREE.Group()

    for (let i = 0; i < amount; i++) {
        const xRope = BALL_RADIUS * (1 - amount + 2 * i)
        if (i == 0) {
            firstRope = createRope(xRope, ROPE_TO_FLOOR, 0)
            ropes.add(firstRope)
        } else if (i == amount - 1) {
            lastRope = createRope(xRope, ROPE_TO_FLOOR, 0)
            ropes.add(lastRope)
        } else {
            ropes.add(createRope(xRope, ROPE_TO_FLOOR, 0))
        }
    }

    // init rotations
    firstRope.rotation.z = -maxAngle
    firstRopeRotateVel = rotateSpeed
    lastRopeRotateVel = 0

    return ropes
}

function createRope(x: number, y: number, z: number) {
    ropeMaterial.transparent = true
    const newRope: THREE.Mesh = new THREE.Mesh(ropeGeometry, ropeMaterial)
    newRope.position.set(x, y, z)
    newRope.castShadow = true
    // scene.add(newRope)

    return newRope
}

function createBars() {
    const bars: THREE.Group = new THREE.Group()

    barMaterial.metalness = 1
    barMaterial.roughness = 0.6
    barMaterial.transparent = true

    bars.add(createBar(0, 5, 0))

    const horizontalLeftBar = createBar(0, 5, 0)
    horizontalLeftBar.rotation.y = Math.PI / 2
    horizontalLeftBar.scale.x = 0.42
    horizontalLeftBar.position.x = -4.90
    bars.add(horizontalLeftBar)

    const horizontalRightBar = horizontalLeftBar.clone()
    horizontalRightBar.position.x = 4.90
    bars.add(horizontalRightBar)

    const vertialBar = createBar(0, 0, 0)
    vertialBar.rotation.z = Math.PI / 2
    vertialBar.position.y = 2.5
    vertialBar.scale.x = 0.5

    const leftBar1 = vertialBar.clone()
    leftBar1.position.x = -4.90
    leftBar1.position.z = -2
    bars.add(leftBar1)

    const leftBar2 = vertialBar.clone()
    leftBar2.position.x = -4.90
    leftBar2.position.z = 2
    bars.add(leftBar2)

    const rightBar1 = vertialBar.clone()
    rightBar1.position.x = 4.90
    rightBar1.position.z = -2
    bars.add(rightBar1)

    const rightBar2 = vertialBar.clone()
    rightBar2.position.x = 4.90
    rightBar2.position.z = 2
    bars.add(rightBar2)

    scene.add(bars)
    return bars
}

function createBar(x: number, y: number, z: number) {
    const newBar: THREE.Mesh = new THREE.Mesh(barGeometry, barMaterial)
    newBar.position.set(x, y, z)
    newBar.castShadow = true
    // scene.add(newBar)

    return newBar
}

function generateSkybox() {
    loadTextures()
    loadMaterials()
    skybox = new THREE.Mesh(skyboxGeometry, materialArray)
    scene.remove(skybox)
    scene.add(skybox)
}

function loadMaterials() {
    materialArray = []
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }))
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }))

    for (let i = 0; i < materialArray.length; i++) {
        materialArray[i].side = THREE.BackSide
    }
}

function loadTextures() {
    texture_ft = new THREE.TextureLoader().load(getTexturePath('ft'))
    texture_bk = new THREE.TextureLoader().load(getTexturePath('bk'))
    texture_up = new THREE.TextureLoader().load(getTexturePath('up'))
    texture_dn = new THREE.TextureLoader().load(getTexturePath('dn'))
    texture_rt = new THREE.TextureLoader().load(getTexturePath('rt'))
    texture_lf = new THREE.TextureLoader().load(getTexturePath('lf'))
}

function getTexturePath(texturePosition: string) {
    return `./resources/textures/${Data.Skybox}/${Data.Skybox}_${texturePosition}.jpg`
}
