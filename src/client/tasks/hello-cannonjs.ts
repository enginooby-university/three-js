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
export let transformableObjects: THREE.Mesh[] = [] // TODO: transform mesh along with its body 
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

let world: CANNON.World
let cannonDebugRenderer: CannonDebugRenderer

let light1: THREE.SpotLight
let light2: THREE.SpotLight

const normalMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial();

type PhysicObject = {
    mesh: THREE.Mesh,
    body: CANNON.Body
}
// object loaded by model loader
type ImportedPhysicObject = PhysicObject & {
    isLoaded: boolean
}
const physicObjects: PhysicObject[] = []
const importedPhysicObjects: ImportedPhysicObject[] = []

const loadingManager = new THREE.LoadingManager(() => {
    importedPhysicObjects.forEach(object => {
        if (object.isLoaded)
            DatHelper.createBodyFolder(gui, object.body, object.mesh.name)
    })
})

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

    // Copy coordinates from Cannon.js to Three.js (sync)
    physicObjects.forEach(object => {
        object.mesh.position.set(object.body.position.x, object.body.position.y, object.body.position.z)
        object.mesh.quaternion.set(object.body.quaternion.x, object.body.quaternion.y, object.body.quaternion.z, object.body.quaternion.w)
    })

    importedPhysicObjects.forEach(object => {
        if (object.isLoaded) {
            object.mesh.position.set(object.body.position.x, object.body.position.y, object.body.position.z)
            object.mesh.quaternion.set(object.body.quaternion.x, object.body.quaternion.y, object.body.quaternion.z, object.body.quaternion.w)
        }
    })
}

function createDatGUI() {
    gui = new GUI({ width: 232 })
    // TODO: create Dat helper for Cannon world
    const physicFolder = gui.addFolder("Physic")
    const gravityFolder = physicFolder.addFolder("Gravity")
    gravityFolder.add(world.gravity, "x", -10.0, 10.0, 0.1)
    gravityFolder.add(world.gravity, "y", -10.0, 10.0, 0.1)
    gravityFolder.add(world.gravity, "z", -10.0, 10.0, 0.1)
    gravityFolder.open()
    physicFolder.open()

    physicObjects.forEach(object => {
        DatHelper.createBodyFolder(gui, object.body, object.mesh.name)
    })
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
    cubeMesh.name = "Cube"
    scene.add(cubeMesh)
    // transformableObjects.push(cubeMesh)

    const cubeShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))
    cubeBody = new CANNON.Body({ mass: 1 });
    cubeBody.addShape(cubeShape)
    cubeBody.position.x = cubeMesh.position.x
    cubeBody.position.y = cubeMesh.position.y
    cubeBody.position.z = cubeMesh.position.z
    world.addBody(cubeBody)

    physicObjects.push({ mesh: cubeMesh, body: cubeBody })
}

let sphereMesh: THREE.Mesh
let sphereBody: CANNON.Body
function createSphere() {
    const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry()
    sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial)
    sphereMesh.position.x = -1
    sphereMesh.position.y = 3
    sphereMesh.castShadow = true
    sphereMesh.name = "Sphere"
    scene.add(sphereMesh)

    const sphereShape = new CANNON.Sphere(1)
    sphereBody = new CANNON.Body({ mass: 1 });
    sphereBody.addShape(sphereShape)
    sphereBody.position.x = sphereMesh.position.x
    sphereBody.position.y = sphereMesh.position.y
    sphereBody.position.z = sphereMesh.position.z
    world.addBody(sphereBody)

    physicObjects.push({ mesh: sphereMesh, body: sphereBody })
}

let icosahedronMesh: THREE.Mesh
let icosahedronBody: CANNON.Body
function createIcosahedron() {
    const icosahedronGeometry: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(1, 0)
    icosahedronMesh = new THREE.Mesh(icosahedronGeometry, normalMaterial)
    icosahedronMesh.position.x = 1
    icosahedronMesh.position.y = 3
    icosahedronMesh.castShadow = true
    icosahedronMesh.name = "Icosahedron"
    scene.add(icosahedronMesh)

    const icosahedronShape = CannonHelper.createConvexPolyhedron(icosahedronGeometry)
    icosahedronBody = new CANNON.Body({ mass: 1 });
    icosahedronBody.addShape(icosahedronShape)
    icosahedronBody.position.x = icosahedronMesh.position.x
    icosahedronBody.position.y = icosahedronMesh.position.y
    icosahedronBody.position.z = icosahedronMesh.position.z
    world.addBody(icosahedronBody)

    physicObjects.push({ mesh: icosahedronMesh, body: icosahedronBody })
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
    cylinderMesh.name = "Cylinder"
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

    physicObjects.push({ mesh: cylinderMesh, body: cylinderBody })
}

let torusKnotMesh: THREE.Mesh
let torusKnotBody: CANNON.Body
function createTorusKnot() {
    const torusKnotGeometry: THREE.TorusKnotGeometry = new THREE.TorusKnotGeometry()
    torusKnotMesh = new THREE.Mesh(torusKnotGeometry, normalMaterial)
    torusKnotMesh.position.x = 4
    torusKnotMesh.position.y = 3
    torusKnotMesh.castShadow = true
    torusKnotMesh.name = "Torus knot"
    scene.add(torusKnotMesh)

    const torusKnotShape = CannonHelper.createTrimesh(<THREE.Geometry>torusKnotMesh.geometry)
    torusKnotBody = new CANNON.Body({ mass: 1 });
    torusKnotBody.addShape(torusKnotShape)
    torusKnotBody.position.x = torusKnotMesh.position.x
    torusKnotBody.position.y = torusKnotMesh.position.y
    torusKnotBody.position.z = torusKnotMesh.position.z
    world.addBody(torusKnotBody)

    physicObjects.push({ mesh: torusKnotMesh, body: torusKnotBody })
}

let monkeyMesh: THREE.Object3D
let monkeyBody: CANNON.Body
let objLoader: OBJLoader
function loadMonkey() {
    objLoader = new OBJLoader(loadingManager)
    objLoader.load(
        `./resources/models/monkey.obj`,
        (object) => {
            scene.add(object)
            monkeyMesh = object.children[0];
            (monkeyMesh as THREE.Mesh).material = normalMaterial
            monkeyMesh.position.x = 0
            monkeyMesh.position.y = 20
            monkeyMesh.position.z = 3
            monkeyMesh.name = "Monkey"

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

            importedPhysicObjects.push({ mesh: <THREE.Mesh>monkeyMesh, body: monkeyBody, isLoaded: true })
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