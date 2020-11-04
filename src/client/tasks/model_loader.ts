import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import { OBJLoader } from '/jsm/loaders/OBJLoader.js'
import { MTLLoader } from '/jsm/loaders/MTLLoader.js'
import { Vector3 } from '/build/three.module.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Mesh[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

const directionalLight = new THREE.DirectionalLight()
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
// const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

let plane: THREE.Mesh
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

const loadingManager = new THREE.LoadingManager(() => {
    hideLoadingScreen()
    createDatGUI()
});
const objLoader = new OBJLoader(loadingManager);
const mtlLoader = new MTLLoader(loadingManager);

let trees: THREE.Group[] = []
const TREE_SCALE: number = 0.004
let monkeys: THREE.Group[] = []
const MONKEY_SCALE: number = 1

export function init() {
    showLoadingScreen()
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    createLight()
    createFloor()
    setupControls()

    loadTreeModel(-2, 0, -2)
    loadTreeModel(2, 0, -2)
    loadMonkeyModel(-2, 1, 2)
    loadMonkeyModel(2, 1, 2)

    // TODO: this will execute before model loaded => nothing is added to scene!
    // transformableObjects.forEach(child => {
    //     scene.add(child)
    // })
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    if (trees.length || monkeys.length) {
        gui = new GUI()
        // TODO: Refactor this
        if (trees.length) {
            const treesFolder = gui.addFolder('Trees')
            for (let i = 0; i < trees.length; i++) {
                DatHelper.createObjectFolder(treesFolder, trees[i], `Tree ${i + 1}`)
            }
        }
        if (monkeys.length) {
            const monkeysFolder = gui.addFolder('Monkeys')
            for (let i = 0; i < monkeys.length; i++) {
                DatHelper.createObjectFolder(monkeysFolder, monkeys[i], `Monkey ${i + 1}`)
            }
        }

    }
}

export function render() {
}

function loadTreeModel(x: number, y: number, z: number) {
    loadModel('tree', trees, TREE_SCALE, new THREE.Vector3(x, y, z))
}

function loadMonkeyModel(x: number, y: number, z: number) {
    loadModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(x, y, z))
}

function loadModel(name: string, group: THREE.Group[], scale: number, position: THREE.Vector3) {
    mtlLoader.load(`./resources/models/${name}.mtl`,
        (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(
                `./resources/models/${name}.obj`,
                (object) => {
                    object.traverse(function (child) {
                        if ((<THREE.Mesh>child).isMesh) {
                            // const material: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial();
                            // (<THREE.Mesh>child).material = material // create a material for each mesh

                            (<THREE.Mesh>child).castShadow = true;
                            (<THREE.Mesh>child).scale.set(scale, scale, scale);
                            (<THREE.Mesh>child).position.set(position.x, position.y, position.z)
                            transformableObjects.push(<THREE.Mesh>child)
                        }
                    })
                    scene.add(object);
                    group.push(object)
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                },
                (error) => {
                    console.log(error);
                }
            )
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% materials loaded');
        },
        (error) => {
            console.log('An error happened');
        }
    )
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
    // scene.add(directionalLightHelper)
    // scene.add(lightShadowHelper);
}

function createFloor() {
    planeMaterial.transparent = true
    plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotateX(-Math.PI / 2)
    plane.position.y = -0.01
    plane.receiveShadow = true;
    plane.scale.set(1.5, 1.5, 1.5)

    transformableObjects.push(plane)
    scene.add(plane)
}