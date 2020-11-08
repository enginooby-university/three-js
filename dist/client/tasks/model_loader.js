import { GUI } from '/jsm/libs/dat.gui.module.js';
import * as DatHelper from '../helpers/dat_helper.js';
import * as THREE from '/build/three.module.js';
import { transformControls, attachToDragControls, hideLoadingScreen, showLoadingScreen } from '../client.js';
import { OBJLoader } from '/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '/jsm/loaders/MTLLoader.js';
import { FBXLoader } from '/jsm/loaders/FBXLoader.js';
import { Vector3 } from '/build/three.module.js';
export const scene = new THREE.Scene();
export let isInitialized = false;
export let gui;
export let skybox; //= 'none'
export const setSkybox = (name) => skybox = name;
// group of objects affected by DragControls & TransformControls
export let transformableObjects = [];
export let selectedObjectId = -1;
export const setSelectedObjectId = (index) => selectedObjectId = index;
const directionalLight = new THREE.DirectionalLight();
// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
// const lightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
let plane;
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
let addModelController;
const percentText = document.querySelector('#loading-percent');
let isLoaded = false;
let addingMode = false; // if not adding model, don't recreate Dat GUI
const loadingManager = new THREE.LoadingManager(() => {
    // setup samples
    const monkeyDemo = monkeys[0];
    monkeyDemo.rotation.set(5.54, 0.8, 0.6);
    const catDemo = cats[0];
    catDemo.rotation.set(4.7, 0, 3.17);
    catDemo.position.set(1.8, 0, 2.7);
    const vanguardDemo = vanguards[0];
    vanguardDemo.group.position.set(vanguardDemo.position.x, vanguardDemo.position.y, vanguardDemo.position.z);
    vanguardDemo.setAction(2);
    vanguardDemo.getBones();
    isLoaded = true;
    hideLoadingScreen();
    if (!addingMode) { // first loading models when init the scene
        createDatGUI();
    }
    else { // adding models by Dat GUI
        const randX = Math.floor(Math.random() * 5);
        const randZ = Math.floor(Math.random() * 5);
        switch (addModelController.getValue()) {
            case 'Monkey':
                addNewModelToGroupFolder(monkeys, monkeysFolder);
                break;
            case 'Tree':
                addNewModelToGroupFolder(trees, treesFolder);
                break;
            case 'Cat':
                addNewModelToGroupFolder(cats, catsFolder);
                // transform new model properly
                const newCat = cats[cats.length - 1];
                newCat.rotation.set(4.7, 0, 3.17);
                newCat.position.set(randX, 0, randZ);
                break;
            case 'Vanguard':
                const newVanguard = vanguards[vanguards.length - 1];
                newVanguard.group.position.set(randX, -0.25, randZ);
                newVanguard.getBones();
                addNewFBXModelToGroupFolder(vanguards, vanguardsFolder);
        }
        addingMode = false; // indicate finish adding
    }
});
const mtlLoader = new MTLLoader(loadingManager); // common
const fbxLoader = new FBXLoader(loadingManager);
let objLoader; // seperate object if use different materials
// TODO: Refactor with array
let trees = [];
let treesFolder;
const TREE_SCALE = 0.004;
let monkeys = [];
let monkeysFolder;
const MONKEY_SCALE = 1;
let cats = [];
let catsFolder;
const CAT_SCALE = 0.08;
let vanguards = [];
let vanguardsFolder;
let vanguardRightArm;
let vanguardLeftArm;
export function init() {
    showLoadingScreen();
    isInitialized = true;
    scene.background = new THREE.Color(0x333333);
    createLight();
    createFloor();
    setupControls();
    initSampleModels();
}
function initSampleModels() {
    loadOBJModel('tree', trees, TREE_SCALE, new Vector3(0, 0, 0), new THREE.MeshPhongMaterial());
    loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(1.5, 0, 1.5));
    loadOBJModel('cat', cats, CAT_SCALE, new Vector3(0, 0, 0), new THREE.MeshPhongMaterial);
    vanguards.push(new Vanguard(-2.5, -0.25, 3));
}
function loadFBXModel(model, loadAnimation) {
    // TODO:  add FBX model to transformable group
    //  let model: THREE.Group = new THREE.Group()
    fbxLoader.load(`./resources/models/${model.NAME}.fbx`, (object) => {
        object.traverse(function (child) {
            // console.log(child);
            if (child.isSkinnedMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
        model.mixer = new THREE.AnimationMixer(object);
        // get default animation from model
        const animationAction = model.mixer.clipAction(object.animations[0]);
        model.animationActions.push(animationAction);
        // object.children is a list of bones
        const skeletonHelper = new THREE.SkeletonHelper(object);
        scene.add(skeletonHelper);
        object.scale.set(model.SCALE, model.SCALE, model.SCALE);
        model.group = object;
        scene.add(object);
        if (loadAnimation !== undefined) {
            loadAnimation();
        }
    }, (xhr) => {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    }, (error) => {
        console.log(error);
    });
}
function loadFBXAnimation(model, animationName, exclusiveTracks, loadAnotherAnimation) {
    fbxLoader.load(`./resources/models/${animationName}.fbx`, (object) => {
        // delete the specific track (VectorKeyframeTrack) that moves the object forward while running
        // console.dir((object as any).animations[0]);
        if (exclusiveTracks !== undefined) {
            exclusiveTracks.forEach(index => object.animations[index].tracks.shift());
        }
        // generate animation for model clip.
        const animationAction = model.mixer.clipAction(object.animations[0]);
        model.animationActions.push(animationAction);
        console.log(`${animationName} animation loaded`);
        if (loadAnotherAnimation !== undefined) {
            loadAnotherAnimation();
        }
    }, (xhr) => {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    }, (error) => {
        console.log(error);
    });
}
export function setupControls() {
    attachToDragControls(transformableObjects);
    transformControls.detach();
    // add to scene to display helpers
    scene.add(transformControls);
}
export function createDatGUI() {
    if (isLoaded) {
        gui = new GUI({ width: 232 });
        const modelOptions = {
            Monkey: "Monkey",
            Tree: "Tree",
            Cat: "Cat",
            Vanguard: "Vanguard"
        };
        const selectModel = {
            name: "Cat"
        };
        const addModelFolder = gui.addFolder('Add model');
        addModelController = addModelFolder.add(selectModel, 'name', modelOptions).name('Select');
        addModelFolder.add(DatFunction, 'addModel').name('Click to add');
        addModelFolder.open();
        treesFolder = gui.addFolder('Trees');
        monkeysFolder = gui.addFolder('Monkeys');
        catsFolder = gui.addFolder('Cats');
        // TODO: Refactor this
        createGroupFolder(trees, treesFolder);
        createGroupFolder(monkeys, monkeysFolder);
        createGroupFolder(cats, catsFolder);
        if (vanguards) {
            vanguardsFolder = gui.addFolder('Vanguards');
            for (let i = 0; i < vanguards.length; i++) {
                vanguards[i].createDatGUI(vanguardsFolder, i + 1);
            }
        }
        // const bodyPartsFolder = vanguardFolder.addFolder('Body parts')
        // // TODO: Refactor with array
        // if (vanguardRightArm) {
        //     DatHelper.createObjectFolder(bodyPartsFolder, vanguardRightArm, "Right arm")
        // }
        // if (vanguardLeftArm) {
        //     DatHelper.createObjectFolder(bodyPartsFolder, vanguardLeftArm, "Left arm")
        // }
    }
}
export function render() {
    if (isLoaded && vanguards) {
        vanguards.forEach(vanguard => {
            vanguard.mixer.update(vanguard.clock.getDelta());
        });
    }
}
const DatFunction = {
    addModel: function () {
        addingMode = true;
        showLoadingScreen();
        switch (addModelController.getValue()) {
            case 'Monkey':
                loadMTLModel('monkey', monkeys, MONKEY_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 1, Math.floor(Math.random() * 5)));
                break;
            case 'Tree':
                loadOBJModel('tree', trees, TREE_SCALE, new THREE.Vector3(Math.floor(Math.random() * 5), 0, Math.floor(Math.random() * 5)), new THREE.MeshPhongMaterial());
                break;
            case 'Cat':
                loadOBJModel('cat', cats, CAT_SCALE, new THREE.Vector3(0, 0, 0), new THREE.MeshPhongMaterial());
                break;
            case 'Vanguard':
                vanguards.push(new Vanguard(0, 0, 0));
                break;
        }
    }
};
function createGroupFolder(group, groupFolder) {
    if (group.length) {
        for (let i = 0; i < group.length; i++) {
            const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
            DatHelper.createObjectFolder(groupFolder, group[i], `${singularName} ${i + 1}`);
        }
    }
}
function addNewModelToGroupFolder(group, groupFolder) {
    const newModelIndex = group.length - 1;
    const singularName = groupFolder.name.substring(0, groupFolder.name.length - 1);
    DatHelper.createObjectFolder(groupFolder, group[newModelIndex], `${singularName} ${newModelIndex + 1}`);
}
function addNewFBXModelToGroupFolder(group, groupFolder) {
    group[group.length - 1].createDatGUI(groupFolder, group.length);
}
function loadMTLModel(name, group, scale, position) {
    mtlLoader.load(`./resources/models/${name}.mtl`, (materials) => {
        materials.preload();
        objLoader = new OBJLoader(loadingManager);
        objLoader.setMaterials(materials);
        loadOBJModel(name, group, scale, position);
    }, (xhr) => {
        // console.log((xhr.loaded / xhr.total * 100) + '% materials loaded');
    }, (error) => {
        console.log('An error happened');
    });
}
function loadOBJModel(name, group, scale, position, material) {
    if (objLoader === undefined) {
        objLoader = new OBJLoader(loadingManager);
    }
    objLoader.load(`./resources/models/${name}.obj`, (object) => {
        object.traverse(function (child) {
            if (child.isMesh) {
                if (material !== undefined) {
                    const newMaterial = material.clone();
                    child.material = newMaterial; // create a material for each mesh
                }
                child.receiveShadow = true;
                child.castShadow = true;
                child.scale.set(scale, scale, scale);
                child.position.set(position.x, position.y, position.z);
                transformableObjects.push(child);
            }
        });
        scene.add(object);
        group.push(object);
    }, (xhr) => {
        let percent = Math.floor(xhr.loaded / xhr.total * 100);
        percentText.innerHTML = `${percent}%`;
    }, (error) => {
        console.log(error);
    });
}
function createLight() {
    directionalLight.position.set(4.5, 21, 13);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.rotation.x = Math.PI / 2;
    scene.add(directionalLight);
    // scene.add(directionalLightHelper)
    // scene.add(lightShadowHelper);
}
function createFloor() {
    planeMaterial.transparent = true;
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    plane.scale.set(1, 1, 1);
    transformableObjects.push(plane);
    scene.add(plane);
}
class Vanguard {
    constructor(x, y, z) {
        this.NAME = "vanguard";
        this.SCALE = 0.045;
        this.group = new THREE.Group();
        this.mixer = new THREE.AnimationMixer(this.group);
        this.clock = new THREE.Clock();
        this.bones = [];
        this.selectBone = new THREE.Bone();
        this.animationActions = [];
        this.activeActionIndex = 0;
        this.lastActionIndex = 0;
        this.position = new THREE.Vector3(x, y, z);
        this.loadModel();
    }
    loadModel() {
        loadFBXModel(this, // animationActions[0]
        () => loadFBXAnimation(this, 'vanguard@samba-dancing', [0], // animationActions[1]
        () => loadFBXAnimation(this, 'vanguard@belly-dancing', [], // animationActions[2]
        () => loadFBXAnimation(this, 'vanguard@goofy-running', [0]))));
    }
    setAction(toActionIndex) {
        if (toActionIndex != this.activeActionIndex) {
            this.lastActionIndex = this.activeActionIndex;
            this.activeActionIndex = toActionIndex;
            // lastAction.stop()
            this.animationActions[this.lastActionIndex].fadeOut(1);
            this.animationActions[this.activeActionIndex].reset();
            this.animationActions[this.activeActionIndex].fadeIn(1);
            this.animationActions[this.activeActionIndex].play();
        }
    }
    getBones() {
        let bones = [];
        this.group.traverse(function (child) {
            // console.log(child);
            if (child.isBone) {
                bones.push(child);
            }
        });
        // filter duplicatte bones by name
        bones = bones.filter((bone, i, arr) => arr.findIndex(t => t.name === bone.name) === i);
        // shorten bone names
        bones.forEach(bone => bone.name = bone.name
            .replace("mixamo", "")
            .replace("rig", "")
            .replace("left", "L_")
            .replace("Left", "L_")
            .replace("right", "R_")
            .replace("Right", "R_"));
        this.bones = bones;
    }
    createDatGUI(groupFolder, index) {
        const vanguardFolder = DatHelper.createObjectFolder(groupFolder, this.group, `Vanguard ${index}`);
        const animationOptions = {
            "default": 0,
            "samba dancing": 1,
            "belly dancing": 2,
            "goofy running": 3,
        };
        const selectAnimation = {
            index: 0
        };
        vanguardFolder.add(selectAnimation, 'index', animationOptions).name('animation').onChange((value) => this.setAction(value)).setValue(this.activeActionIndex);
        const selectBone = {
            name: ''
        };
        const boneParam = {
            xPosition: 0,
            yPosition: 0,
            zPosition: 0,
            xRotation: 0,
            yRotation: 0,
            zRotation: 0,
            xScale: 1,
            yScale: 1,
            zScale: 1,
        };
        const boneFolder = vanguardFolder.addFolder("Edit bone");
        boneFolder.add(selectBone, 'name', this.bones.map(bone => bone.name))
            .name('Select')
            .onChange(value => this.selectBone = this.bones.find(bone => bone.name === value));
        const bonePositionFolder = boneFolder.addFolder("position");
        bonePositionFolder.add(boneParam, 'xPosition', -50, 50, 0.1)
            .name('x')
            .onChange(value => this.selectBone.position.x = value);
        bonePositionFolder.add(boneParam, 'yPosition', -50, 50, 0.1)
            .name('y')
            .onChange(value => this.selectBone.position.y = value);
        bonePositionFolder.add(boneParam, 'zPosition', -50, 50, 0.1)
            .name('z')
            .onChange(value => this.selectBone.position.z = value);
        const boneRotationFolder = boneFolder.addFolder("rotation");
        boneRotationFolder.add(boneParam, 'xRotation', 0, Math.PI * 2, 0.01)
            .name('x')
            .onChange(value => this.selectBone.rotation.x = value);
        boneRotationFolder.add(boneParam, 'yRotation', 0, Math.PI * 2, 0.01)
            .name('y')
            .onChange(value => this.selectBone.rotation.x = value);
        boneRotationFolder.add(boneParam, 'zRotation', 0, Math.PI * 2, 0.01)
            .name('z')
            .onChange(value => this.selectBone.rotation.x = value);
        const boneScaleFolder = boneFolder.addFolder("scale");
        boneScaleFolder.add(boneParam, 'xScale', 0, 5, 0.1)
            .name('x')
            .onChange(value => this.selectBone.scale.x = value);
        boneScaleFolder.add(boneParam, 'yScale', 0, 5, 0.1)
            .name('y')
            .onChange(value => this.selectBone.scale.y = value);
        boneScaleFolder.add(boneParam, 'zScale', 0, 5, 0.1)
            .name('z')
            .onChange(value => this.selectBone.scale.z = value);
    }
}
