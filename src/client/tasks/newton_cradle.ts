import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, raycaster } from '../client.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string = 'arid'
export const setSkybox = (name: string) => skybox = name

let Param = {
    VerBallAmount: 5,
    VerBallSpeed: 3,
    VerBallMaxAngle: 40, // degree
    HorBallAmount: 3,
    HorBallSpeed: 5,
    HorBallMaxAngle: 60, // degree
}

let verBallAmount: number = 5
let horBallAmount: number = 3
const BALL_RADIUS: number = 0.5
const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64)
const ballMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 1,
    roughness: 0.6,
    transparent: true
})
let firstVerBall: THREE.Mesh // in vertical group
let lastVerBall: THREE.Mesh
let firstHorBall: THREE.Mesh
let lastHorBall: THREE.Mesh

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
let firstVerRope: THREE.Mesh
let lastVerRope: THREE.Mesh
let firstHorRope: THREE.Mesh
let lastHorRope: THREE.Mesh
const ropeGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.03, 0.03, ROPE_LENGHT)
const ropeMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000 })

let rotateSpeedVerBall: number = 0.03
let maxAngleVerBall: number = 40 * Math.PI / 180
let rotateSpeedHorBall: number = 0.05
let maxAngleHorBall: number = 60 * Math.PI / 180
let firstVerRopeRotateVel: number
let lastVerRopeRotateVel: number
let firstHorRopeRotateVel: number
let lastHorRopeRotateVel: number

const audioListener: THREE.AudioListener = new THREE.AudioListener()
const audioLoader: THREE.AudioLoader = new THREE.AudioLoader()
let ballAudio: THREE.PositionalAudio

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
// groups of objects which will be recreated on desire (e.g change in Dat GUI)
let balls: THREE.Mesh[] = []
let ropes: THREE.Mesh[] = []

export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

export function init() {
    isInitialized = true

    // change ropes' origin (pivot) for rotation
    ropeGeometry.translate(0, -ROPE_LENGHT / 2, 0)
    createBalls(verBallAmount, horBallAmount)
    createRopes(verBallAmount, horBallAmount)
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
    transformableObjects.forEach(child => scene.add(child))
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    gui = new GUI()
    gui.width = 232

    const verticalGroupFolder = gui.addFolder('Vertical group')
    verticalGroupFolder.add(Param, 'VerBallAmount', 3, 9, 1).name('Ball number').onChange(() => {
        verBallAmount = Param.VerBallAmount;
        updateBallNumber()
    })
    verticalGroupFolder.add(Param, 'VerBallSpeed', 1, 10, 1).name('Ball speed').onChange(() => {
        rotateSpeedVerBall = Param.VerBallSpeed / 100
    })
    verticalGroupFolder.add(Param, 'VerBallMaxAngle', 10, 70, 1).name('Max angle').onChange(() => {
        maxAngleVerBall = Param.VerBallMaxAngle * Math.PI / 180
    })
    verticalGroupFolder.open()

    const horizontalGroupFolder = gui.addFolder('Horizontal group')
    horizontalGroupFolder.add(Param, 'HorBallAmount', 3, 9, 1).name('Ball number').onChange(() => {
        horBallAmount = Param.HorBallAmount;
        updateBallNumber()
    })
    horizontalGroupFolder.add(Param, 'HorBallSpeed', 1, 10, 1).name('Ball speed').onChange(() => {
        rotateSpeedHorBall = Param.HorBallSpeed / 100
    })
    horizontalGroupFolder.add(Param, 'HorBallMaxAngle', 10, 70, 1).name('Max angle').onChange(() => {
        maxAngleHorBall = Param.HorBallMaxAngle * Math.PI / 180
    })
    horizontalGroupFolder.open()

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
    if (lastVerRopeRotateVel == 0) {
        if (firstVerRope.rotation.z >= 0) {
            playBallAudio()
            firstVerRopeRotateVel = 0
            firstVerRope.rotation.z = 0
            lastVerRopeRotateVel = rotateSpeedVerBall
        }
        if (firstVerRope.rotation.z <= -maxAngleVerBall) {
            firstVerRopeRotateVel = rotateSpeedVerBall
        }

        // when first ball&rope is staying
    } else if (firstVerRopeRotateVel == 0) {
        if (lastVerRope.rotation.z <= 0) {
            playBallAudio()
            firstVerRopeRotateVel = -rotateSpeedVerBall
            lastVerRope.rotation.z = 0
            lastVerRopeRotateVel = 0
        }
        if (lastVerRope.rotation.z >= maxAngleVerBall) {
            lastVerRopeRotateVel = -rotateSpeedVerBall
        }
    }

    // when last ball&rope is staying
    if (lastHorRopeRotateVel == 0) {
        if (firstHorRope.rotation.x <= 0) {
            playBallAudio()
            firstHorRopeRotateVel = 0
            firstHorRope.rotation.x = 0
            lastHorRopeRotateVel = -rotateSpeedHorBall
        }
        if (firstHorRope.rotation.x >= maxAngleHorBall) {
            firstHorRopeRotateVel = -rotateSpeedHorBall
        }

        // when first ball&rope is staying
    }
    else if (firstHorRopeRotateVel == 0) {
        if (lastHorRope.rotation.x >= 0) {
            playBallAudio()
            firstHorRopeRotateVel = rotateSpeedHorBall
            lastHorRope.rotation.x = 0
            lastHorRopeRotateVel = 0
        }
        if (lastHorRope.rotation.x <= -maxAngleHorBall) {
            lastHorRopeRotateVel = rotateSpeedHorBall
        }
    }

    // update first and last rope rotations
    firstVerRope.rotation.z += firstVerRopeRotateVel
    lastVerRope.rotation.z += lastVerRopeRotateVel

    firstHorRope.rotation.x += firstHorRopeRotateVel
    lastHorRope.rotation.x += lastHorRopeRotateVel

    // update first and last ball positions
    firstVerBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(firstVerRope.rotation.z) + BALL_RADIUS * (1 - verBallAmount + 2 * 0) // original x of first ver ball
    firstVerBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstVerRope.rotation.z)
    lastVerBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(lastVerRope.rotation.z) + BALL_RADIUS * (1 - verBallAmount + 2 * (verBallAmount - 1)) // original x of last ver ball
    lastVerBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastVerRope.rotation.z)

    firstHorBall.position.z = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(-firstHorRope.rotation.x) + BALL_RADIUS * (1 - horBallAmount + 2 * 0) // original z of first hor ball
    firstHorBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstHorRope.rotation.x)
    lastHorBall.position.z = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(-lastHorRope.rotation.x) + BALL_RADIUS * (1 - horBallAmount + 2 * (horBallAmount - 1)) // original z of last hor ball
    lastHorBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastHorRope.rotation.x)
}

function updateBallNumber() {
    let objectIsSelected: boolean = false
    // clear objects
    balls.forEach(ball => {
        // reset selected object if it is the ball
        if (ball.id == selectedObjectId) {
            objectIsSelected = true
            selectedObjectId = -1;
            (ball.material as any).emissive.set(0x000000);
        }
        // remove all balls in transformable group
        transformableObjects = transformableObjects.filter(object => object !== ball)
        scene.remove(ball)
        balls = []
    })
    ropes.forEach(rope => {
        if (rope.id == selectedObjectId) {
            objectIsSelected = true
            selectedObjectId = -1;
            (rope.material as any).emissive.set(0x000000);
        }
        // remove all ropes in transformable group
        transformableObjects = transformableObjects.filter(object => object !== rope)
        scene.remove(rope)
        ropes = []
    })

    createBalls(verBallAmount, horBallAmount)
    createRopes(verBallAmount, horBallAmount)
    // add objects
    balls.forEach(ball => scene.add(ball))
    ropes.forEach(rope => scene.add(rope))

    if (objectIsSelected) {
        // re-attach TransformControls if the current sellected object is re-created
        setupControls()
    } else {
        attachToDragControls(transformableObjects)
    }
}

// TODO: create helper to play sound
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
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.rotation.x = Math.PI / 2

    scene.add(directionalLight)
    scene.add(directionalLightHelper)
    scene.add(lightShadowHelper);
}

function createFloor() {
    planeMaterial.transparent = true
    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotateX(-Math.PI / 2)
    plane.position.y = -0.01
    plane.receiveShadow = true;

    transformableObjects.push(plane)
    scene.add(plane)
}

function createBalls(verAmount: number, horAmount: number) {
    for (let i = 0; i < verAmount; i++) {
        const xVerBall: number = BALL_RADIUS * (1 - verAmount + 2 * i)
        const newVerBall = createBall(xVerBall, 1, 0)

        if (i == 0) {
            firstVerBall = newVerBall
        }
        if (i == verAmount - 1) {
            lastVerBall = newVerBall
        }
    }

    for (let i = 0; i < horAmount; i++) {
        const zHorBall: number = BALL_RADIUS * (1 - horAmount + 2 * i)
        const newHorBall = createBall(0, 1, zHorBall)

        if (i == 0) {
            firstHorBall = newHorBall
        }
        if (i == horAmount - 1) {
            lastHorBall = newHorBall
        }
    }
}
function createBall(x: number, y: number, z: number) {
    const newBall: THREE.Mesh = new THREE.Mesh(sphereGeometry, ballMaterial)
    newBall.position.set(x, y, z)
    newBall.castShadow = true

    transformableObjects.push(newBall)
    balls.push(newBall)
    return newBall
}

function createRopes(verAmount: number, horAmount: number) {
    // create ropes in vertical group
    for (let i = 0; i < verAmount; i++) {
        const xVerRope = BALL_RADIUS * (1 - verAmount + 2 * i)
        const newRope = createRope(xVerRope, ROPE_TO_FLOOR, 0)
        if (i == 0) {
            firstVerRope = newRope
        }
        if (i == verAmount - 1) {
            lastVerRope = newRope
        }
    }

    // create ropes in horizontal group
    for (let i = 0; i < horAmount; i++) {
        const zHorRope = BALL_RADIUS * (1 - horAmount + 2 * i)
        const newRope = createRope(0, ROPE_TO_FLOOR, zHorRope)
        if (i == 0) {
            firstHorRope = newRope
        }
        if (i == horAmount - 1) {
            lastHorRope = newRope
        }
    }

    // init rotations
    firstVerRope.rotation.z = -maxAngleVerBall // firstVerRope = ropes[0]
    firstVerRopeRotateVel = rotateSpeedVerBall
    lastVerRopeRotateVel = 0
    firstHorRope.rotation.x = maxAngleVerBall // firstHorRope = ropes[verAmount]
    firstHorRopeRotateVel = -rotateSpeedVerBall
    lastHorRopeRotateVel = 0
}
function createRope(x: number, y: number, z: number) {
    ropeMaterial.transparent = true
    const newRope: THREE.Mesh = new THREE.Mesh(ropeGeometry, ropeMaterial)
    newRope.position.set(x, y, z)
    newRope.castShadow = true

    transformableObjects.push(newRope)
    ropes.push(newRope)
    return newRope
}

function createBars() {
    const horizontalBarGroup: THREE.Group = new THREE.Group()

    barMaterial.metalness = 1
    barMaterial.roughness = 0.6
    barMaterial.transparent = true

    horizontalBarGroup.add(createBar(0, 5, 0))

    const horizontalLeftBar = createBar(0, 5, 0)
    horizontalLeftBar.rotation.y = Math.PI / 2
    horizontalLeftBar.scale.x = 0.42
    horizontalLeftBar.position.x = -4.90
    horizontalBarGroup.add(horizontalLeftBar)

    const horizontalRightBar = horizontalLeftBar.clone()
    horizontalRightBar.position.x = 4.90
    horizontalBarGroup.add(horizontalRightBar)

    const verticalBar = createBar(0, 0, 0)
    verticalBar.rotation.z = Math.PI / 2
    verticalBar.position.y = 2.5
    verticalBar.scale.x = 0.5

    const leftBar1 = verticalBar.clone()
    leftBar1.position.x = -4.90
    leftBar1.position.z = -2
    horizontalBarGroup.add(leftBar1)

    const leftBar2 = verticalBar.clone()
    leftBar2.position.x = -4.90
    leftBar2.position.z = 2
    horizontalBarGroup.add(leftBar2)

    const rightBar1 = verticalBar.clone()
    rightBar1.position.x = 4.90
    rightBar1.position.z = -2
    horizontalBarGroup.add(rightBar1)

    const rightBar2 = verticalBar.clone()
    rightBar2.position.x = 4.90
    rightBar2.position.z = 2
    horizontalBarGroup.add(rightBar2)

    horizontalBarGroup.children.forEach((child) => {
        transformableObjects.push(<THREE.Mesh>child)
    })

    const verticalBarGroup = horizontalBarGroup.clone()
    verticalBarGroup.rotation.y = Math.PI / 2

    // TODO: verticalBarGroup rotatation by it origin when push this way
    // verticalBarGroup.children.forEach((child) => {
    //     transformableObjects.push(<THREE.Mesh>child)
    // })

    scene.add(verticalBarGroup)
}
function createBar(x: number, y: number, z: number) {
    const newBar: THREE.Mesh = new THREE.Mesh(barGeometry, barMaterial)
    newBar.position.set(x, y, z)
    newBar.castShadow = true

    return newBar
}
