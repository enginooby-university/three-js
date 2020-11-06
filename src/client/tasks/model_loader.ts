import { GUI, GUIController } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from '../helpers/dat_helper.js'
import * as THREE from '/build/three.module.js'
import { transformControls, attachToDragControls, muted, hideLoadingScreen, showLoadingScreen } from '../client.js'
import { OBJLoader } from '/jsm/loaders/OBJLoader.js'
import { MTLLoader } from '/jsm/loaders/MTLLoader.js'
import { FBXLoader } from '/jsm/loaders/FBXLoader.js'
import { MeshPhongMaterial, Vector3 } from '/build/three.module.js'

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
    monkeys[0].rotation.set(5.54, 0.8, 0.6);
    cats[0].rotation.set(4.7, 0, 3.17)
    cats[0].position.set(1.8, 0, 2.7)
    // model.rotation.set(Math.PI / 2, 0, -Math.PI / 2)
    model.position.set(-2.5, -0.25, 3)
    activeAction = animationActions[0]
    setAction(animationActions[1])

    isLoaded = true
    hideLoadingScreen()

    if (!addingMode) {// first loading when init the scene
        createDatGUI()
    } else {// add by Dat GUI
        switch (addModelController.getValue()) {
            case 'Monkey':
                addNewModelToGroupFolder(monkeys, monkeyFolder)
                break
            case 'Tree':
                addNewModelToGroupFolder(trees, treeFolder)
                break
            case 'Cat':
                addNewModelToGroupFolder(cats, catFolder)
                // transform new model properly
                const randX = Math.floor(Math.random() * 5)
                const randZ = Math.floor(Math.random() * 5)
                cats[cats.length - 1].rotation.set(4.7, 0, 3.17)
                cats[cats.length - 1].position.set(randX, 0, randZ)
                break
        }
        addingMode = false // indicate finish adding
    }
});
const mtlLoader: MTLLoader = new MTLLoader(loadingManager); // common
let objLoader: OBJLoader // seperate object for different material

let trees: THREE.Group[] = []
let treeFolder: GUI
const TREE_SCALE: number = 0.004

let monkeys: THREE.Group[] = []
let monkeyFolder: GUI
const MONKEY_SCALE: number = 1

let cats: THREE.Group[] = []
let catFolder: GUI
const CAT_SCALE = 0.08

let mixer: THREE.AnimationMixer
let modelReady = false;
let animationActions: THREE.AnimationAction[] = new Array()
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction
const fbxLoader: FBXLoader = new FBXLoader(loadingManager);
let animationsFolder: GUI
let model: THREE.Group

let vanguardRightArm: THREE.Bone
let vanguardLeftArm: THREE.Bone

export function init() {
    showLoadingScreen()
    isInitialized = true
    scene.background = new THREE.Color(0x333333)
    createLight()
    createFloor()
    setupControls()

    // samples
    loadModel('tree', trees, TREE_SCALE, new Vector3(0, 0, 0), new THREE.MeshPhongMaterial())
    loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(1.5, 0, 1.5))
    loadModel('cat', cats, CAT_SCALE, new Vector3(0, 0, 0), new THREE.MeshPhongMaterial)

    // TODO: this will execute before model loaded => nothing is added to scene!
    // transformableObjects.forEach(child => {
    //     scene.add(child)
    // })

    // TODO: Refactor this, add FBX model to transformable group
    fbxLoader.load(
        './resources/models/vanguard.fbx',
        (object) => {
            object.traverse(function (child) {
                console.log(child);
                if ((<THREE.SkinnedMesh>child).isSkinnedMesh) {
                    (<THREE.SkinnedMesh>child).receiveShadow = true;
                    (<THREE.SkinnedMesh>child).castShadow = true;
                }
            })

            vanguardRightArm = object.getObjectByName('mixamorigRightArm') as THREE.Bone
            vanguardLeftArm = object.getObjectByName('mixamorigLeftArm') as THREE.Bone

            mixer = new THREE.AnimationMixer(object);
            // get default animation (T-pose) from object
            let animationAction = mixer.clipAction((object as any).animations[0]);
            animationActions.push(animationAction)

            object.scale.set(.045, .045, .045)
            model = object
            scene.add(object);

            //add an animation from another file
            fbxLoader.load(
                './resources/models/vanguard@samba-dancing.fbx',
                (object) => {
                    object.traverse(function (child) {
                        // console.log(child);

                        if ((<THREE.Mesh>child).isMesh) {
                            (<THREE.Mesh>child).receiveShadow = true;
                            (<THREE.Mesh>child).castShadow = true;
                            transformableObjects.push(<THREE.Mesh>child)
                        }
                        if ((<THREE.Bone>child).isBone) {
                            child.castShadow = true
                        }
                    })

                    console.log("loaded samba");
                    (object as any).animations[0].tracks.shift()
                    let animationAction = mixer.clipAction((object as any).animations[0]);
                    animationActions.push(animationAction)

                    //add an animation from another file
                    fbxLoader.load(
                        './resources/models/vanguard@belly-dancing.fbx',
                        (object) => {
                            console.log("loaded bellydance")
                            let animationAction = mixer.clipAction((object as any).animations[0]);
                            animationActions.push(animationAction)

                            //add an animation from another file
                            fbxLoader.load(
                                './resources/models/vanguard@goofy-running.fbx',
                                (object) => {
                                    console.log("loaded goofyrunning");
                                    //delete the specific track that moves the object forward while running
                                    (object as any).animations[0].tracks.shift()
                                    //console.dir((object as any).animations[0])
                                    let animationAction = mixer.clipAction((object as any).animations[0]);
                                    animationActions.push(animationAction)

                                    modelReady = true
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
                            // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                        },
                        (error) => {
                            console.log(error);
                        }
                    )
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
            console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
            console.log(error);
        }
    )

}


const setAction = (toAction: THREE.AnimationAction) => {
    if (toAction != activeAction) {
        lastAction = activeAction
        activeAction = toAction
        // lastAction.stop()
        lastAction.fadeOut(1)
        activeAction.reset()
        activeAction.fadeIn(1)
        activeAction.play()
    }
}

export function setupControls() {
    attachToDragControls(transformableObjects)

    transformControls.detach()
    // add to scene to display helpers
    scene.add(transformControls)
}

export function createDatGUI() {
    if (isLoaded) {
        gui = new GUI({ width: 232 })


        const modelOptions = {
            Monkey: "Monkey",
            Tree: "Tree",
            Cat: "Cat"
        }
        const selectModel = {
            name: "Cat"
        }
        const addModelFolder = gui.addFolder('Add model')
        addModelController = addModelFolder.add(selectModel, 'name', modelOptions).name('Select')
        addModelFolder.add(DatFunction, 'addModel').name('Click to add')
        addModelFolder.open()

        treeFolder = gui.addFolder('Trees')
        monkeyFolder = gui.addFolder('Monkeys')
        catFolder = gui.addFolder('Cats')
        // TODO: Refactor this
        createGroupFolder(trees, treeFolder)
        createGroupFolder(monkeys, monkeyFolder)
        createGroupFolder(cats, catFolder)

        // Vanguard
        // TODO: use dropdown lish instead
        const animations = {
            default: function () {
                setAction(animationActions[0])
            },
            samba: function () {
                setAction(animationActions[1])
            },
            bellydance: function () {
                setAction(animationActions[2])
            },
            goofyrunning: function () {
                setAction(animationActions[3])
            },
        }

        const vanguardFolder = DatHelper.createObjectFolder(gui, model, 'Vanguard')
        animationsFolder = vanguardFolder.addFolder('Animations')
        animationsFolder.add(animations, "default")
        animationsFolder.add(animations, "samba")
        animationsFolder.add(animations, "bellydance")
        animationsFolder.add(animations, "goofyrunning")
        animationsFolder.open()

        const bodyPartsFolder = vanguardFolder.addFolder('Body parts')
        // TODO: Refactor with array
        if (vanguardRightArm) {
            DatHelper.createObjectFolder(bodyPartsFolder, vanguardRightArm, "Right arm")
        }
        if (vanguardLeftArm) {
            DatHelper.createObjectFolder(bodyPartsFolder, vanguardLeftArm, "Left arm")
        }
    }
}

const clock: THREE.Clock = new THREE.Clock()
export function render() {
    if (modelReady) mixer.update(clock.getDelta());
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
                loadModel('tree', trees, TREE_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 0, Math.floor(Math.random() * 5)), new THREE.MeshPhongMaterial())
                break
            case 'Cat':
                loadModel('cat', cats, CAT_SCALE, new THREE.Vector3(0, 0, 0), new THREE.MeshPhongMaterial())
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

function loadMTLModel(name: string, group: THREE.Group[], scale: number, position: THREE.Vector3) {
    mtlLoader.load(`./resources/models/${name}.mtl`,
        (materials) => {
            materials.preload();

            objLoader = new OBJLoader(loadingManager);
            objLoader.setMaterials(materials);
            loadModel(name, group, scale, position)
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% materials loaded');
        },
        (error) => {
            console.log('An error happened');
        }
    )
}


function loadModel(name: string, group: THREE.Group[], scale: number, position: THREE.Vector3, material?: THREE.Material) {
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
    // directionalLight.intensity = 2
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