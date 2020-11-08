import { GUI, GUIController } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import { OBJLoader } from '/jsm/loaders/OBJLoader.js'
import { MTLLoader } from '/jsm/loaders/MTLLoader.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'
import { Vanguard } from '../models/fbx-models/vanguard.js'

export const scene: THREE.Scene = new THREE.Scene()
export let isInitialized: boolean = false
export let gui: GUI
export let skybox: string //= 'none'
export const setSkybox = (name: string) => skybox = name

// group of objects affected by DragControls & TransformControls
export let transformableObjects: THREE.Object3D[] = []
export let selectedObjectId: number = -1
export const setSelectedObjectId = (index: number) => selectedObjectId = index

const directionalLight = new THREE.DirectionalLight()
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
// const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

let plane: THREE.Mesh
const planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 10)
const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

let addModelController: GUIController

const percentText = document.querySelector('#loading-percent')!
let isLoaded: boolean = false
let addingMode: boolean = false // if not adding model, don't recreate Dat GUI
const loadingManager = new THREE.LoadingManager(() => {
    // setup samples
    const monkeyDemo = monkeys[0]
    monkeyDemo.rotation.set(5.54, 0.8, 0.6)
    const catDemo = cats[0]
    catDemo.rotation.set(4.7, 0, 3.17)
    catDemo.position.set(1.8, 0, 2.7)
    const vanguardDemo: Vanguard = vanguards[0]
    vanguardDemo.group.position.set(vanguardDemo.position.x, vanguardDemo.position.y, vanguardDemo.position.z)
    vanguardDemo.setAction(2)
    vanguardDemo.getBones()
    scene.add(vanguardDemo.group)
    scene.add(vanguardDemo.skeletonHelper)

    isLoaded = true
    hideLoadingScreen()

    if (!addingMode) { // first loading models when init the scene
        createDatGUI()
    } else { // adding models by Dat GUI
        const randX = Math.floor(Math.random() * 5)
        const randZ = Math.floor(Math.random() * 5)
        switch (addModelController.getValue()) {
            case 'Monkey':
                addNewModelToGroupFolder(monkeys, monkeysFolder)
                break
            case 'Tree':
                addNewModelToGroupFolder(trees, treesFolder)
                break
            case 'Cat':
                addNewModelToGroupFolder(cats, catsFolder)
                // transform new model properly
                const newCat = cats[cats.length - 1]
                newCat.rotation.set(4.7, 0, 3.17)
                newCat.position.set(randX, 0, randZ)
                break
            case 'Vanguard':
                const newVanguard = vanguards[vanguards.length - 1]
                newVanguard.group.position.set(randX, -0.25, randZ)
                newVanguard.getBones()
                scene.add(newVanguard.group)
                scene.add(newVanguard.skeletonHelper)
                addNewFBXModelToGroupFolder(vanguards, vanguardsFolder)
        }
        addingMode = false // indicate finish adding
    }
});

const mtlLoader: MTLLoader = new MTLLoader(loadingManager); // common
const fbxLoader: FBXLoader = new FBXLoader(loadingManager);
let objLoader: OBJLoader // seperate object if use different materials

// TODO: Refactor with array
let trees: THREE.Group[] = []
let treesFolder: GUI
const TREE_SCALE: number = 0.004

let monkeys: THREE.Group[] = []
let monkeysFolder: GUI
const MONKEY_SCALE: number = 1

let cats: THREE.Group[] = []
let catsFolder: GUI
const CAT_SCALE = 0.08

let vanguards: Vanguard[] = []
let vanguardsFolder: GUI

export function init() {
    showLoadingScreen()
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    createLight()
    createFloor()
    setupControls()
    initSampleModels()
    createDatGUI()
}

function initSampleModels() {
    loadOBJModel('tree', trees, TREE_SCALE, new THREE.Vector3(0, 0, 0), new THREE.MeshPhongMaterial())
    loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(1.5, 0, 1.5))
    loadOBJModel('cat', cats, CAT_SCALE, new THREE.Vector3(0, 0, 0), new THREE.MeshPhongMaterial)
    vanguards.push(new Vanguard(fbxLoader, -2.5, -0.25, 3))
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

function createDatGUI() {
    if (isLoaded) {
        gui = new GUI({ width: 232 })

        const modelOptions = {
            Monkey: "Monkey",
            Tree: "Tree",
            Cat: "Cat",
            Vanguard: "Vanguard"
        }
        const selectModel = {
            name: "Cat"
        }
        const addModelFolder = gui.addFolder('Add model')
        addModelController = addModelFolder.add(selectModel, 'name', modelOptions).name('Select')
        addModelFolder.add(DatFunction, 'addModel').name('Click to add')
        addModelFolder.open()

        treesFolder = gui.addFolder('Trees')
        monkeysFolder = gui.addFolder('Monkeys')
        catsFolder = gui.addFolder('Cats')
        // TODO: Refactor this
        createGroupFolder(trees, treesFolder)
        createGroupFolder(monkeys, monkeysFolder)
        createGroupFolder(cats, catsFolder)

        if (vanguards) {
            vanguardsFolder = gui.addFolder('Vanguards')
            for (let i = 0; i < vanguards.length; i++) {
                vanguards[i].createDatGUI(vanguardsFolder, i + 1)
            }
        }
    }
}

export function render() {
    if (isLoaded && vanguards) {
        vanguards.forEach(vanguard => {
            vanguard.mixer.update(vanguard.clock.getDelta())
        })
    }
}

const DatFunction = {
    addModel: function () {
        addingMode = true
        showLoadingScreen()
        switch (addModelController.getValue()) {
            case 'Monkey':
                loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 1, Math.floor(Math.random() * 5)))
                break
            case 'Tree':
                loadOBJModel('tree', trees, TREE_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 0, Math.floor(Math.random() * 5)), new THREE.MeshPhongMaterial())
                break
            case 'Cat':
                loadOBJModel('cat', cats, CAT_SCALE, new THREE.Vector3(0, 0, 0), new THREE.MeshPhongMaterial())
                break
            case 'Vanguard':
                vanguards.push(new Vanguard(fbxLoader, 0, 0, 0))
                break
        }
    }
}

function createGroupFolder(group: THREE.Group[], groupFolder: GUI) {
    if (group.length) {
        for (let i = 0; i < group.length; i++) {
            const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
            DatHelper.createObjectFolder(groupFolder, group[i], `${singularName} ${i + 1}`)
        }
    }
}

function addNewModelToGroupFolder(group: THREE.Group[], groupFolder: GUI) {
    const newModelIndex = group.length - 1
    const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
    DatHelper.createObjectFolder(groupFolder, group[newModelIndex], `${singularName} ${newModelIndex + 1}`)
}

function addNewFBXModelToGroupFolder(group: Vanguard[], groupFolder: GUI) {
    group[group.length - 1].createDatGUI(groupFolder, group.length)

}

function loadMTLModel(name: string, group: THREE.Group[], scale: number, position: THREE.Vector3) {
    mtlLoader.load(`./resources/models/${name}.mtl`,
        (materials) => {
            materials.preload();

            objLoader = new OBJLoader(loadingManager);
            objLoader.setMaterials(materials);
            loadOBJModel(name, group, scale, position)
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% materials loaded');
        },
        (error) => {
            console.log('An error happened');
        }
    )
}


function loadOBJModel(name: string, group: THREE.Group[], scale: number, position: THREE.Vector3, material?: THREE.Material) {
    if (objLoader === undefined) {
        objLoader = new OBJLoader(loadingManager);
    }

    objLoader.load(
        `./resources/models/${name}.obj`,
        (object) => {
            object.traverse(function (child) {
                if ((<THREE.Mesh>child).isMesh) {
                    if (material !== undefined) {
                        const newMaterial = material.clone();
                        (<THREE.Mesh>child).material = newMaterial // create a material for each mesh
                    }

                    (<THREE.Mesh>child).receiveShadow = true;
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
            let percent: number = Math.floor(xhr.loaded / xhr.total * 100)
            percentText.innerHTML = `${percent}%`
        },
        (error) => {
            console.log(error);
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
    plane.scale.set(1, 1, 1)

    transformableObjects.push(plane)
    scene.add(plane)
}