import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import CannonHelper from '../helpers/cannon-helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import '/cannon/build/cannon.min.js'
import CannonDebugRenderer from '../utils/cannonDebugRenderer.js'
import { OBJLoader } from '/jsm/loaders/OBJLoader.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string = 'cocoa'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let world: CANNON.World
let cannonDebugRenderer: CannonDebugRenderer

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
    createSphere()
    createFloor()
    createIcosahedron()
    createTorusKnot()
    createCylinder()
    loadMonkey()
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
    cannonDebugRenderer.update()

    // TODO: link meshes with body using map... and refactor this
    // Copy coordinates from Cannon.js to Three.js (sync)
    cubeMesh.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
    cubeMesh.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w);
    sphereMesh.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
    sphereMesh.quaternion.set(sphereBody.quaternion.x, sphereBody.quaternion.y, sphereBody.quaternion.z, sphereBody.quaternion.w);
    cylinderMesh.position.set(cylinderBody.position.x, cylinderBody.position.y, cylinderBody.position.z);
    cylinderMesh.quaternion.set(cylinderBody.quaternion.x, cylinderBody.quaternion.y, cylinderBody.quaternion.z, cylinderBody.quaternion.w);
    icosahedronMesh.position.set(icosahedronBody.position.x, icosahedronBody.position.y, icosahedronBody.position.z);
    icosahedronMesh.quaternion.set(icosahedronBody.quaternion.x, icosahedronBody.quaternion.y, icosahedronBody.quaternion.z, icosahedronBody.quaternion.w);
    torusKnotMesh.position.set(torusKnotBody.position.x, torusKnotBody.position.y, torusKnotBody.position.z);
    torusKnotMesh.quaternion.set(torusKnotBody.quaternion.x, torusKnotBody.quaternion.y, torusKnotBody.quaternion.z, torusKnotBody.quaternion.w);
    if (monkeyLoaded) {
        monkeyMesh.position.set(monkeyBody.position.x, monkeyBody.position.y, monkeyBody.position.z);
        monkeyMesh.quaternion.set(monkeyBody.quaternion.x, monkeyBody.quaternion.y, monkeyBody.quaternion.z, monkeyBody.quaternion.w);
    }
}

function createDatGUI() {
    gui = new GUI({ width: 232 })
    // TODO: create Dat helper for Cannon world
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

    cannonDebugRenderer = new CannonDebugRenderer(scene, world)
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
    // transformableObjects.push(cubeMesh)

    const cubeShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))
    cubeBody = new CANNON.Body({ mass: 1 });
    cubeBody.addShape(cubeShape)
    cubeBody.position.x = cubeMesh.position.x
    cubeBody.position.y = cubeMesh.position.y
    cubeBody.position.z = cubeMesh.position.z
    world.addBody(cubeBody)
}

let sphereMesh: THREE.Mesh
let sphereBody: CANNON.Body
function createSphere() {
    const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry()
    sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial)
    sphereMesh.position.x = -1
    sphereMesh.position.y = 3
    sphereMesh.castShadow = true
    scene.add(sphereMesh)
    const sphereShape = new CANNON.Sphere(1)
    sphereBody = new CANNON.Body({ mass: 1 });
    sphereBody.addShape(sphereShape)
    sphereBody.position.x = sphereMesh.position.x
    sphereBody.position.y = sphereMesh.position.y
    sphereBody.position.z = sphereMesh.position.z
    world.addBody(sphereBody)
}

let icosahedronMesh: THREE.Mesh
let icosahedronBody: CANNON.Body
function createIcosahedron() {
    const icosahedronGeometry: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(1, 0)
    icosahedronMesh = new THREE.Mesh(icosahedronGeometry, normalMaterial)
    icosahedronMesh.position.x = 1
    icosahedronMesh.position.y = 3
    icosahedronMesh.castShadow = true
    scene.add(icosahedronMesh)

    const icosahedronShape =CannonHelper.createConvexPolyhedron(icosahedronGeometry)
    icosahedronBody = new CANNON.Body({ mass: 1 });
    icosahedronBody.addShape(icosahedronShape)
    icosahedronBody.position.x = icosahedronMesh.position.x
    icosahedronBody.position.y = icosahedronMesh.position.y
    icosahedronBody.position.z = icosahedronMesh.position.z
    world.addBody(icosahedronBody)
}

let cylinderMesh: THREE.Mesh
let cylinderBody: CANNON.Body
function createCylinder() {
    const cylinderGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 8)
    cylinderMesh = new THREE.Mesh(cylinderGeometry, normalMaterial)
    cylinderMesh.position.x = 0
    cylinderMesh.position.y = 3
    cylinderMesh.position.z = -3
    cylinderMesh.castShadow = true
    scene.add(cylinderMesh)

    const cylinderShape = new CANNON.Cylinder(1, 1, 2, 8)
    cylinderBody = new CANNON.Body({ mass: 1 });
    const cylinderQuaternion = new CANNON.Quaternion()
    cylinderQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
    cylinderBody.addShape(cylinderShape, new CANNON.Vec3, cylinderQuaternion)
    cylinderBody.position.x = cylinderMesh.position.x
    cylinderBody.position.y = cylinderMesh.position.y
    cylinderBody.position.z = cylinderMesh.position.z
    world.addBody(cylinderBody)
}

let torusKnotMesh: THREE.Mesh
let torusKnotBody: CANNON.Body
function createTorusKnot() {
    const torusKnotGeometry: THREE.TorusKnotGeometry = new THREE.TorusKnotGeometry()
    torusKnotMesh = new THREE.Mesh(torusKnotGeometry, normalMaterial)
    torusKnotMesh.position.x = 4
    torusKnotMesh.position.y = 3
    torusKnotMesh.castShadow = true
    scene.add(torusKnotMesh)

    const torusKnotShape = CannonHelper.createTrimesh(<THREE.Geometry>torusKnotMesh.geometry)
    torusKnotBody = new CANNON.Body({ mass: 1 });
    torusKnotBody.addShape(torusKnotShape)
    torusKnotBody.position.x = torusKnotMesh.position.x
    torusKnotBody.position.y = torusKnotMesh.position.y
    torusKnotBody.position.z = torusKnotMesh.position.z
    world.addBody(torusKnotBody)
}

let monkeyMesh: THREE.Object3D
let monkeyBody: CANNON.Body
let monkeyLoaded: Boolean = false
const objLoader: OBJLoader = new OBJLoader();
function loadMonkey() {
    objLoader.load(
        `./resources/models/monkey.obj`,
        (object) => {
            scene.add(object)
            monkeyMesh = object.children[0];
            (monkeyMesh as THREE.Mesh).material = normalMaterial
            monkeyMesh.position.x = 0
            monkeyMesh.position.y = 20
            monkeyMesh.position.z = 3

            const monkeyShape = CannonHelper.createTrimesh((monkeyMesh as THREE.Mesh).geometry)
            monkeyBody = new CANNON.Body({ mass: 1 });
            monkeyBody.addShape(monkeyShape)
            //monkeyBody.addShape(cubeShape)
            // monkeyBody.addShape(sphereShape)
            // monkeyBody.addShape(cylinderShape)
            // monkeyBody.addShape(icosahedronShape)
            // monkeyBody.addShape(new CANNON.Plane())
            // monkeyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2)
            monkeyBody.position.x = monkeyMesh.position.x
            monkeyBody.position.y = monkeyMesh.position.y
            monkeyBody.position.z = monkeyMesh.position.z
            world.addBody(monkeyBody)
            monkeyLoaded = true
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.log('An error happened');
        }
    );

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