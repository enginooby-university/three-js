import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
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

let Name = {
    Skybox: "arid"
}

const options = {
    skybox: {
        "Arid": "arid",
        "Cocoa": "cocoa",
        "Dust": "dust",
    }
}

const BALL_AMOUNT: number = 3
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
const ropeMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xA52A2A })

const ROTATE_SPEED: number = 0.03
const MAX_ANGLE: number = 0.7
let firstRopeRotateVel: number
let lastRopeRotateVel: number

init()

export function init() {
    generateSkybox()
    createBalls(BALL_AMOUNT)
    createRopes(BALL_AMOUNT)
    createBars()
    createLight()
    createFloor()
}

export function createDatGUI() {
    gui = new GUI()
    gui.add(Name, 'Skybox', options.skybox).onChange(() => generateSkybox())
    DatHelper.createDirectionalLightFolder(gui, directionalLight)
    const ballFolder: GUI = gui.addFolder("Balls")
    DatHelper.createPhysicalMaterialFolder(ballFolder, ballMaterial)
    const ropeFolder: GUI = gui.addFolder("Ropes")
    DatHelper.createMaterialFolder(ropeFolder, ropeMaterial)
    const barFolder: GUI = gui.addFolder("Bars")
    DatHelper.createPhysicalMaterialFolder(barFolder, barMaterial)
    const floorFolder = DatHelper.createObjectFolder(gui, plane, 'Floor')
    DatHelper.createMaterialFolder(floorFolder, planeMaterial)
}

export function render() {
    lightShadowHelper.update()

    // when last ball&rope is staying
    if (lastRopeRotateVel == 0) {
        if (firstRope.rotation.z >= 0) {
            firstRopeRotateVel = 0
            lastRopeRotateVel = ROTATE_SPEED
        }

        if (firstRope.rotation.z <= -MAX_ANGLE) {
            firstRopeRotateVel = ROTATE_SPEED
        }

        // when first ball&rope is staying
    } else if (firstRopeRotateVel == 0) {
        if (lastRope.rotation.z <= 0) {
            firstRopeRotateVel = -ROTATE_SPEED
            lastRopeRotateVel = 0
        }

        if (lastRope.rotation.z >= MAX_ANGLE) {
            lastRopeRotateVel = -ROTATE_SPEED
        }
    }

    // update first and last rope rotations
    firstRope.rotation.z += firstRopeRotateVel
    lastRope.rotation.z += lastRopeRotateVel

    // update first and last ball positions
    firstBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(firstRope.rotation.z) + BALL_RADIUS * (1 - BALL_AMOUNT + 2 * 0) // original x of first ball
    firstBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(firstRope.rotation.z)
    lastBall.position.x = (ROPE_LENGHT + BALL_RADIUS) * Math.sin(lastRope.rotation.z) + BALL_RADIUS * (1 - BALL_AMOUNT + 2 * (BALL_AMOUNT - 1)) // original x of last ball
    lastBall.position.y = ROPE_TO_FLOOR - (ROPE_LENGHT + BALL_RADIUS) * Math.cos(lastRope.rotation.z)
}

function createLight() {
    directionalLight.position.set(4.5, 21, 13)
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
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

function createBalls(amount: number) {
    const balls: THREE.Group = new THREE.Group()
    ballMaterial.metalness = 1
    ballMaterial.roughness = 0.6
    ballMaterial.transparent = true

    for (let i = 0; i < amount; i++) {
        const xBall: number = BALL_RADIUS * (1 - amount + 2 * i)
        if (i == 0) {
            firstBall = createBall(xBall, 1, 0)
        } else if (i == amount - 1) {
            lastBall = createBall(xBall, 1, 0)
        } else {
            createBall(xBall, 1, 0)
        }
    }
}

function createBall(x: number, y: number, z: number) {
    const newBall: THREE.Mesh = new THREE.Mesh(sphereGeometry, ballMaterial)
    newBall.position.set(x, y, z)
    newBall.castShadow = true
    scene.add(newBall)

    return newBall
}

function createRopes(amount: number) {
    ropeGeometry.translate(0, -ROPE_LENGHT / 2, 0)

    for (let i = 0; i < amount; i++) {
        const xRope = BALL_RADIUS * (1 - amount + 2 * i)
        if (i == 0) {
            firstRope = createRope(xRope, ROPE_TO_FLOOR, 0)
        } else if (i == amount - 1) {
            lastRope = createRope(xRope, ROPE_TO_FLOOR, 0)
        } else {
            createRope(xRope, ROPE_TO_FLOOR, 0)
        }
    }

    firstRope.rotation.z = -MAX_ANGLE
    firstRopeRotateVel = ROTATE_SPEED
    lastRopeRotateVel = 0
}

function createRope(x: number, y: number, z: number) {
    const newRope: THREE.Mesh = new THREE.Mesh(ropeGeometry, ropeMaterial)
    newRope.position.set(x, y, z)
    newRope.castShadow = true
    scene.add(newRope)

    return newRope
}

function createBars() {
    barMaterial.metalness = 1
    barMaterial.roughness = 0.6
    barMaterial.transparent = true
    createBar(0, 5, 0)
    const leftBar = createBar(0, 0, 0)
    leftBar.rotation.z = Math.PI / 2
    leftBar.position.x = -4.90
    leftBar.position.y = 2.5
    leftBar.scale.x = 0.5
    const rightBar = createBar(0, 0, 0)
    rightBar.rotation.z = Math.PI / 2
    rightBar.position.x = 4.90
    rightBar.position.y = 2.5
    rightBar.scale.x = 0.5
}

function createBar(x: number, y: number, z: number) {
    const newBar: THREE.Mesh = new THREE.Mesh(barGeometry, barMaterial)
    newBar.position.set(x, y, z)
    newBar.castShadow = true
    scene.add(newBar)

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
    return `./resources/textures/${Name.Skybox}/${Name.Skybox}_${texturePosition}.jpg`
}
