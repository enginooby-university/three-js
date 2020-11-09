import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import '/cannon/build/cannon.min.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let world: CANNON.World

let light1: THREE.SpotLight
let light2: THREE.SpotLight

const normalMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial()

export function init() {
    isInitialized = true
    scene.background = new THREE.Color(0x333333)

    setupPhysic()
    createLights()
    createCube()
    createFloor()
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

const clock: THREE.Clock = new THREE.Clock()
export function render() {
    let delta = clock.getDelta()
    if (delta > .1) delta = .1
    world.step(delta)

    // Copy coordinates from Cannon.js to Three.js
    cubeMesh.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
    cubeMesh.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w);
}

function createDatGUI() {
    gui = new GUI()
    const gravityFolder = gui.addFolder("Gravity")
    gravityFolder.add(world.gravity, "x", -10.0, 10.0, 0.1)
    gravityFolder.add(world.gravity, "y", -10.0, 10.0, 0.1)
    gravityFolder.add(world.gravity, "z", -10.0, 10.0, 0.1)
    gravityFolder.open()
}

function createLights() {
    light1 = new THREE.SpotLight();
    light1.position.set(2.5, 5, 5)
    light1.angle = Math.PI / 4
    light1.penumbra = 0.5
    light1.castShadow = true;
    light1.shadow.mapSize.width = 1024;
    light1.shadow.mapSize.height = 1024;
    light1.shadow.camera.near = 0.5;
    light1.shadow.camera.far = 20
    scene.add(light1);

    light2 = new THREE.SpotLight();
    light2.position.set(-2.5, 5, 5)
    light2.angle = Math.PI / 4
    light2.penumbra = 0.5
    light2.castShadow = true;
    light2.shadow.mapSize.width = 1024;
    light2.shadow.mapSize.height = 1024;
    light2.shadow.camera.near = 0.5;
    light2.shadow.camera.far = 20
    scene.add(light2);
}

function setupPhysic() {
    world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)
    //world.broadphase = new CANNON.NaiveBroadphase() //
    //world.solver.iterations = 10
    //world.allowSleep = true
}

let cubeMesh: THREE.Mesh
let cubeBody: CANNON.Body
function createCube() {
    const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
    cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial)
    cubeMesh.position.x = -3
    cubeMesh.position.y = 3
    cubeMesh.castShadow = true
    scene.add(cubeMesh)
    const cubeShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))
    cubeBody = new CANNON.Body({ mass: 1 });
    cubeBody.addShape(cubeShape)
    cubeBody.position.x = cubeMesh.position.x
    cubeBody.position.y = cubeMesh.position.y
    cubeBody.position.z = cubeMesh.position.z
    world.addBody(cubeBody)
}

function createFloor() {
    const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
    const planeMesh: THREE.Mesh = new THREE.Mesh(planeGeometry, phongMaterial)
    planeMesh.rotateX(-Math.PI / 2)
    planeMesh.receiveShadow = true;
    scene.add(planeMesh)
    const planeShape = new CANNON.Plane()
    const planeBody = new CANNON.Body({ mass: 0 })
    planeBody.addShape(planeShape)
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(planeBody)
}