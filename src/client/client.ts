import * as THREE from '/build/three.module.js'
import { Tasks } from './task_management.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import { DragControls } from '/jsm/controls/DragControls.js'
import { TransformControls } from '/jsm/controls/TransformControls.js'
import { PointerLockControls } from '/jsm/controls/PointerLockControls.js'
import Stats from '/jsm/libs/stats.module.js'
import { GUI, GUIController } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from './helpers/dat_helper.js'
import { VRButton } from '/jsm/webxr/VRButton.js'
import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js'
// import { BloomPass } from '/jsm/postprocessing/BloomPass.js'
import { FilmPass } from '/jsm/postprocessing/FilmPass.js'
import { SMAAPass } from '/jsm/postprocessing/SMAAPass.js'

export let camera: THREE.PerspectiveCamera
const CAMERA_FOV: number = 50 //degrees
const CAMERA_NEAR: number = 0.001
const CAMERA_FAR: number = 1000

let pause: boolean = false
export let muted: boolean = true
let orbitControlsEnabled: boolean = true

let currentTask: any // TODO: use type, maybe create class for each task?
const FIRST_SCENE_INDEX: number = 2
let currentScene: THREE.Scene
const canvas: HTMLCanvasElement = document.getElementById("threejs-canvas") as HTMLCanvasElement
export const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false })
let composer: EffectComposer
// let bloomPass: BloomPass
let filmPass: FilmPass

const gui = new GUI({
    autoPlace: true, //?
    width: 232,
})

let postProcessingFolder = gui.addFolder("Post processing")
let statsGUIs: Stats[] = []
let transformModeControler: GUIController
let pointerLockControlEnableControler: GUIController
let skyboxController: GUIController

let sourceLink: string
const vrButton: HTMLElement = VRButton.createButton(renderer)

export let orbitControls: OrbitControls
export let dragControls: DragControls
export let transformControls: TransformControls
export let pointerLockControls: PointerLockControls

const SOURCE_LINK_BASE: string = 'https://github.com/enginoobz-university/three-js/tree/master/src/client/tasks/'
const STATS_WIDTH: string = '100%'
const STATS_HEIGHT: string = '100%'

/* HELPERS */
const AXE_LENGHT: number = 5
const axesHelper: THREE.AxesHelper = new THREE.AxesHelper(AXE_LENGHT)
const GRID_SIZE: number = 10
const GRID_DIVISIONS: number = 10
const gridHelper: THREE.GridHelper = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS)
let cameraHelper: THREE.CameraHelper

/* SKYBOX */
const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
let skybox: THREE.Mesh
let texture_ft: THREE.Texture
let texture_bk: THREE.Texture
let texture_up: THREE.Texture
let texture_dn: THREE.Texture
let texture_rt: THREE.Texture
let texture_lf: THREE.Texture
let materialArray: THREE.MeshBasicMaterial[]

const Param = {
    Skybox: "arid",
    BloomPass: {
        opacity: 1
    },
    FilmPass: {
        grayscale: 0,
        nIntensity: 0,
        sIntensity: 0,
        sCount: 0
    },
    TransformControls: {
        mode: "scale"
    },
    DragControls: {
        opacity: 0.33,
        // emissive: 0xff0000
    },
    // ShowHelpers: true
}

export const raycaster: THREE.Raycaster = new THREE.Raycaster()
const mouse: THREE.Vector2 = new THREE.Vector2()

init()
animate(1)

export function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')!
    loadingScreen.classList.remove('fade-out');
}

export function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')!
    loadingScreen.classList.add('fade-out');
    // optional: remove loader from DOM via event listener
    // loadingScreen.addEventListener('transitionend', onTransitionEnd);
}

// function onTransitionEnd(event: any) {
//     event.target.remove();
// }

function init() {
    camera = createCamera()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // renderer.outputEncoding = THREE.sRGBEncoding
    renderer.xr.enabled = true
    document.body.appendChild(vrButton)
    vrButton.style.marginBottom = "80px"
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    //document.body.appendChild(renderer.domElement)

    dragControls = new DragControls([], camera, renderer.domElement)
    createControls()
    createStatsGUI()
    switchScene(FIRST_SCENE_INDEX)
    createDatGUI()
    updateScenePostProcessing()
    // createPostProcessingFolder()
    hideLoadingScreen()
}

function createControls() {
    pointerLockControls = new PointerLockControls(camera, renderer.domElement)
    pointerLockControls.addEventListener('unlock', function () {
        pointerLockControlEnableControler.name('enabled')
        pointerLockControlEnableControler.setValue(false)
    });

    pointerLockControls.addEventListener('lock', function () {
        pointerLockControlEnableControler.name('disable (Esc)')
    });

    orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.minDistance = 2
    orbitControls.maxDistance = 300
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.05
    // orbitControlsEnabled=false

    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode("scale")

    transformControls.addEventListener('dragging-changed', function (event) {
        orbitControls.enabled = !event.value
        dragControls.enabled = !event.value
    })
}

export function attachToDragControls(objects: THREE.Object3D[] | THREE.Mesh[]) {
    dragControls.dispose()
    dragControls = new DragControls(objects, camera, renderer.domElement)
    dragControls.addEventListener("hoveron", function (event) {
        orbitControls.enabled = false;
        // const elme = document.querySelector('html')! as HTMLElement
        // elme.style.cursor = 'move'
    });
    dragControls.addEventListener("hoveroff", function () {
        orbitControls.enabled = true;
    });
    dragControls.addEventListener('dragstart', function (event) {
        event.object.material.opacity = Param.DragControls.opacity
        // event.object.material.emissive.setHex(Data.DragControls.emissive);
    })
    dragControls.addEventListener('dragend', function (event) {
        event.object.material.opacity = 1
        // event.object.material.emissive.setHex(0x000000);        
    })
}

function createCamera() {
    const newCamera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR)
    newCamera.position.set(12, 12, 12)
    cameraHelper = new THREE.CameraHelper(newCamera)
    cameraHelper.visible = false

    return newCamera
}

function createDatGUI() {
    const options = {
        skybox: {
            "None": "none",
            "Arid": "arid",
            "Cocoa": "cocoa",
            "Dust": "dust",
        }
    }

    skyboxController = gui.add(Param, 'Skybox', options.skybox).onChange((value) => {
        if (value == 'none') {
            const currentSkybox = currentScene.getObjectByName('skybox')!
            currentSkybox.visible = false
        } else {
            generateSkybox()
        }
        currentTask.setSkybox(value)
    })

    const guiFolder = gui.addFolder('GUI')
    guiFolder.add(gui, 'width', 100, 300, 1)

    createControlFolder()
    generateSkybox()
    createHelperGUIFolder()
    DatHelper.createCameraFolder(gui, camera, 'Perspective Camera')
}

function createControlFolder() {
    const options = {
        "Scale (S)": 'scale',
        "Rotate (R)": 'rotate',
        "Translate (T)": 'translate'
    }

    const controlFolder = gui.addFolder("Controls")

    const transformControlsFolder = controlFolder.addFolder("TransformControls")
    transformControlsFolder.add(transformControls, 'enabled', true)
    transformModeControler = transformControlsFolder.add(Param.TransformControls, 'mode', options).name('Transform mode').onChange((value) => transformControls.setMode(value))
    transformControlsFolder.open()

    const dragControlsFolder = controlFolder.addFolder("DragControls")
    // dragControlsFolder.addColor(Data.DragControls, 'emissive').onChange((value) => { Data.DragControls.emissive = Number(value.toString().replace('#', '0x')) });
    dragControlsFolder.add(Param.DragControls, 'opacity', 0.1, 1, 0.1)
    dragControlsFolder.open()

    const pointerLockControlsFolder = controlFolder.addFolder("PointerLockControls")
    pointerLockControlEnableControler = pointerLockControlsFolder.add(pointerLockControls, 'isLocked').name("enabled").onChange((value) => {
        if (value) {
            orbitControlsEnabled = false
            pointerLockControls.lock()
        } else {
            orbitControlsEnabled = true
            pointerLockControls.unlock()
        }
    })
    pointerLockControlsFolder.open()

    const orbitControlsFolder = controlFolder.addFolder("OrbitControls")
    orbitControlsFolder.add(orbitControls, 'enabled', true).onChange((value) => {
        orbitControlsEnabled = value
    })
    orbitControlsFolder.add(orbitControls, 'autoRotate', false)
    orbitControlsFolder.add(orbitControls, 'autoRotateSpeed', 1, 20, 1)
    orbitControlsFolder.add(orbitControls, 'enableDamping', true)
    orbitControlsFolder.add(orbitControls, 'dampingFactor', 0.01, 0.1, 0.01)
    orbitControlsFolder.add(orbitControls, 'minDistance', 0, 100, 1)
    orbitControlsFolder.add(orbitControls, 'maxDistance', 100, 300, 10)
    // orbitControlsFolder.add(orbitControls, 'screenSpacePanning', true)
    // orbitControlsFolder.add(orbitControls, 'minAzimuthAngle', 0, Math.PI / 8, 0.1)
    // orbitControlsFolder.add(orbitControls, 'maxAzimuthAngle', 0, Math.PI / 2, 0.1)
    // orbitControlsFolder.add(orbitControls, 'minPolarAngle', 0, Math.PI / 8, 0.1)
    // orbitControlsFolder.add(orbitControls, 'maxPolarAngle', 0, Math.PI / 8, 0.1)

    // controls.enableKeys = true
    // controls.keys = {
    //     LEFT: 37, //left arrow
    //     UP: 38, // up arrow
    //     RIGHT: 39, // right arrow
    //     BOTTOM: 40 // down arrow
    // }
    // controls.mouseButtons = {
    //     LEFT: THREE.MOUSE.ROTATE,
    //     MIDDLE: THREE.MOUSE.DOLLY,
    //     RIGHT: THREE.MOUSE.PAN
    // }
    // controls.touches = {
    //     ONE: THREE.TOUCH.ROTATE,
    //     TWO: THREE.TOUCH.DOLLY_PAN
    // }

    controlFolder.open()
    return controlFolder
}

function createHelperGUIFolder() {
    const helperFolder = gui.addFolder("Helpers")

    // const options = {
    //     "Show all": true,
    //     "Hide all": false,
    // }
    // helperFolder.add(Data, 'ShowHelpers', options).name("").onChange((value) => {
    //     axesHelper.visible = value
    //     gridHelper.visible = value
    //     cameraHelper.visible = value
    // })

    helperFolder.addFolder("Axes").add(axesHelper, "visible", true)
    helperFolder.addFolder("Grid").add(gridHelper, "visible", true)
    helperFolder.addFolder("Camera").add(cameraHelper, "visible", false)
    // helperFolder.open()

    return helperFolder
}

function createPostProcessingFolder() {
    // gui.removeFolder(bloomFolder)
    // const newBloomPassFolder = gui.addFolder('BloomPass');
    // newBloomPassFolder.add((<any>bloomPass.copyUniforms).opacity, 'value', 0, 2).name('strength').onChange((value) => {
    //     Data.BloomPass.opacity = value
    // })
    // // TODO: update other properties of bloomPass
    // // newBloomPassFolder.add(bloomPass, 'resolution', 1, 256, 1)
    // newBloomPassFolder.open();
    // bloomFolder = newBloomPassFolder

    gui.removeFolder(postProcessingFolder)
    postProcessingFolder = gui.addFolder("Post processing")
    const newFilmPassFolder = postProcessingFolder.addFolder('FilmPass');
    newFilmPassFolder.add((<any>filmPass.uniforms).grayscale, 'value', 0, 1, 1).name('grayscale').onChange((value) => Param.FilmPass.grayscale = value)
    newFilmPassFolder.add((<any>filmPass.uniforms).nIntensity, 'value', 0, 1).name('noise intensity').onChange((value) => Param.FilmPass.nIntensity = value)
    // TODO: no-impact properties???
    // newFilmPassFolder.add((<any>filmPass.uniforms).sIntensity, 'value', 0, 1).name('scanline intensity').onChange((value) => Data.FilmPass.sIntensity = value)
    // newFilmPassFolder.add((<any>filmPass.uniforms).sCount, 'value', 0, 1000).name('scanline count').onChange((value) => Data.FilmPass.sCount = value)
    newFilmPassFolder.open();
    postProcessingFolder.open()
}

function switchScene(scenceIndex: number) {
    // if switch scene at least one time
    if (currentTask !== undefined) {
        unselectPreviousObject()

        // destroy Dat GUI for previous scene (if it exists)
        if (currentTask.gui !== undefined) {
            (currentTask.gui as GUI).destroy()
        }
    }

    currentTask = Array.from(Tasks)[scenceIndex][0]
    if (!currentTask.isInitialized) {
        currentTask.init()
    }

    // create Dat GUI for current scene
    currentTask.createDatGUI()
    currentTask.setupControls()

    currentScene = currentTask.scene
    // update source link corresponding to current task (scene)
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[scenceIndex][1]
    currentScene.add(axesHelper)
    currentScene.add(gridHelper)
    currentScene.add(cameraHelper)

    orbitControls.enabled = orbitControlsEnabled

    // update skybox controller value
    if (skyboxController !== undefined) {
        if (currentTask.skybox === undefined) {
            Param.Skybox = 'none'
        } else {
            Param.Skybox = currentTask.skybox
        }
        skyboxController.updateDisplay()
    }

    updateScenePostProcessing()
}

function updateScenePostProcessing() {
    // reset composer
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(currentScene, camera))
    // bloomPass = new BloomPass(
    //     Data.BloomPass.opacity,    // strength
    //     25,   // kernel size
    //     4,    // sigma ?
    //     256,  // blur render target resolution
    // );
    // composer.addPass(bloomPass);
    filmPass = new FilmPass(
        Param.FilmPass.nIntensity,
        Param.FilmPass.sIntensity,
        Param.FilmPass.sCount,
        Param.FilmPass.grayscale
    );
    filmPass.renderToScreen = true;
    composer.addPass(filmPass);

    // for antialias since built-in antialiasing doesn’t work with post-processing
    const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    createPostProcessingFolder()
}

function createStatsGUI() {
    for (let i = 0; i < 3; i++) {
        const statsGUI = Stats()
        statsGUI.showPanel(i); // 0: fps, 1: ms, 2: mb, 3+: custom
        statsGUI.dom.style.top = `${60 * i + 100}px`
        statsGUIs.push(statsGUI)
        document.body.appendChild(statsGUI.dom)

        const children = statsGUI.dom.childNodes as NodeListOf<HTMLCanvasElement>
        children.forEach(child => {
            child.style.width = STATS_WIDTH
            child.style.height = STATS_HEIGHT
        })
    }
}

function animate(time: number) {
    time *= 0.001 // convert to seconde
    // console.log(Math.floor(time))

    if (renderer.xr.isPresenting) {
        renderer.setAnimationLoop(animate)
    } else {
        requestAnimationFrame(animate)
    }

    render()
}

function render() {
    raycaster.setFromCamera(mouse, camera)

    if (!pause) { // only render current active scene
        currentTask.render()
    }
    // updateSelectObject()
    composer.render()

    if (orbitControlsEnabled) {
        orbitControls.update()
    }

    for (let i = 0; i < statsGUIs.length; i++) {
        statsGUIs[i].update()
    }
}

/* SKYBOX */
function generateSkybox() {
    loadTextures()
    loadMaterials()
    skybox = new THREE.Mesh(skyboxGeometry, materialArray)
    skybox.name = "skybox"
    currentScene.remove(skybox)
    skybox.visible = true
    currentScene.add(skybox)
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
    return `./resources/textures/${Param.Skybox}/${Param.Skybox}_${texturePosition}.jpg`
}
/* END SKYBOX */

/* WINDOW EVENTS */
window.addEventListener('click', onWindowClick, false);
function onWindowClick(event: MouseEvent) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // TODO: need to set time out for some reasons? 
    setTimeout(updateSelectObject, 10)
}
function updateSelectObject() {
    const intersectObjects: THREE.Intersection[] = raycaster.intersectObjects(currentTask.transformableObjects, false)

    try {
        unselectPreviousObject()
        if (intersectObjects.length) {
            // get the object on top where mouse currently points to
            const currentSelectedObject = intersectObjects[0].object as THREE.Mesh
            transformControls.attach(currentSelectedObject);
            // TODO: problem with definition file (types): emissive not exist on THREE.Material
            (currentSelectedObject.material as any).emissive.set(0x444444);
            currentTask.setSelectedObjectId(currentSelectedObject.id)
        }
    } catch (error) {
        if (error instanceof TypeError)
            console.log('The material type of selected object does not have emissive property :(')
    }

}
function unselectPreviousObject() {
    if (currentTask.selectedObjectId != -1) {
        // do s.t with previous selected object 
        const previousSelectedObject = currentScene.getObjectById(currentTask.selectedObjectId) as THREE.Mesh
        (previousSelectedObject.material as any).emissive.set(0x000000);
        transformControls.detach()
    }
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // render()
}

window.addEventListener('keydown', function (event) {
    switch (event.key) {
        case "t":
            transformControls.setMode("translate")
            // update GUI when using keyboard
            transformModeControler.setValue('translate')
            break
        case "r":
            transformControls.setMode("rotate")
            transformModeControler.setValue('rotate')
            break
        case "s":
            transformControls.setMode("scale")
            transformModeControler.setValue('scale')
            break
        case "p":
            handlePauseButton()
            break
        case "m":
            handleAudioButton()
            break
        case "c":
            handleScreenshotButton()
            break
    }
})
/* END EVENTS */

/* BUTTONS - LINKS */
// handle scene switch
const taskButtons = document.querySelectorAll(".task")
const description = document.querySelector("#info")!
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        const title: string = taskButtons[i].innerHTML
        // strip the number (1. ABC -> ABC)
        description.innerHTML = title.substr(title.indexOf(' ') + 1)
        switchScene(i)
    })
}

const sourceButton: HTMLElement = document.getElementById('source-link')!
sourceButton.onclick = function () {
    window.open(
        sourceLink,
        '_blank'
    )
}

const screenshotButton = document.querySelector('#screenshot')!
screenshotButton.addEventListener('click', handleScreenshotButton, false);
function handleScreenshotButton() {
    render();
    canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
    return
}
const saveBlob = (function () {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob: Blob | null, fileName: string) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
    };
}());

const pauseButton = document.querySelector("#pause")!
const pauseIcon = document.querySelector('#pause-icon')!
pauseButton.addEventListener('click', handlePauseButton, false);
function handlePauseButton() {
    pauseIcon.classList.toggle('fa-pause')
    pauseIcon.classList.toggle('fa-play')
    pause = !pause

    const tooltiptextElement = document.querySelector('#pause > .tooltip > .tooltiptext')!
    if (pause) {
        tooltiptextElement.innerHTML = "Play (P)"
    } else {
        tooltiptextElement.innerHTML = "Pause (P)"
    }
}

const audioButton = document.querySelector("#audio")!
const audioIcon = document.querySelector("#audio-icon")!
audioButton.addEventListener('click', handleAudioButton, false)
function handleAudioButton() {
    audioIcon.classList.toggle('fas-volume-mute')
    audioIcon.classList.toggle('fa-volume-up')
    muted = !muted

    const tooltiptextElement = document.querySelector('#audio > .tooltip > .tooltiptext')!
    if (muted) {
        tooltiptextElement.innerHTML = "Unmute (M)"
    } else {
        tooltiptextElement.innerHTML = "Mute (M)"
    }
}

/* SIDEBAR STUFFS*/
const sidebarOpenButton = document.querySelector(".openbtn")!
sidebarOpenButton.addEventListener('click', openNav, false)
const sidebarCloseButton = document.querySelector(".closebtn")!
sidebarCloseButton.addEventListener('click', closeNav, false)

const sidebarElement = document.getElementById("mySidebar")!
const mainElement = document.getElementById("main")!

function openNav() {
    sidebarElement.style.width = "250px"
    mainElement.style.marginLeft = "250px"
    statsGUIs.forEach(stat => {
        stat.dom.style.marginLeft = "250px"
    })
}

openNav()

function closeNav() {
    sidebarElement.style.width = "0";
    mainElement.style.marginLeft = "0";
    statsGUIs.forEach(stat => {
        stat.dom.style.marginLeft = "0"
    })
}