import * as THREE from '/build/three.module.js'
import { Tasks } from './task_management.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import Stats from '/jsm/libs/stats.module.js'
import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from './helpers/dat_helper.js'
import { VRButton } from '/jsm/webxr/VRButton.js'
import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js'
// import { BloomPass } from '/jsm/postprocessing/BloomPass.js'
import { FilmPass } from '/jsm/postprocessing/FilmPass.js'

let camera: THREE.PerspectiveCamera
const CAMERA_FOV: number = 50 //degrees
const CAMERA_NEAR: number = 0.001
const CAMERA_FAR: number = 1000

let pause: boolean = false
export let muted: boolean = true

let currentScene: THREE.Scene
let currentSceneIndex: number = 0
const canvas: HTMLCanvasElement = document.getElementById("threejs-canvas") as HTMLCanvasElement
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
let composer: EffectComposer
// let bloomPass: BloomPass
let filmPass: FilmPass
const gui = new GUI()
let postProcessingFolder = gui.addFolder("Post processing")
let statsGUIs: Stats[] = []
let controls: OrbitControls
let sourceLink: string
const vrButton: HTMLElement = VRButton.createButton(renderer)

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

const Data = {
    BloomPass: {
        opacity: 1
    },
    FilmPass: {
        grayscale: 0,
        nIntensity: 0,
        sIntensity: 0,
        sCount: 0
    },
}

init()
animate()

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

    controls = new OrbitControls(camera, renderer.domElement)
    controls.maxDistance = 300
    createStatsGUI()
    createHelperGUIFolder()
    DatHelper.createCameraFolder(gui, camera, 'Perspective Camera')
    switchScene(2)
    // createPostProcessingFolder()
}

function createCamera() {
    const newCamera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR)
    newCamera.position.set(6, 6, 10)
    cameraHelper = new THREE.CameraHelper(newCamera)
    cameraHelper.visible = false

    return newCamera
}

function createHelperGUIFolder() {
    const helperFolder = gui.addFolder("Helpers")
    helperFolder.addFolder("Axes").add(axesHelper, "visible", true)
    helperFolder.addFolder("Grid").add(gridHelper, "visible", true)
    helperFolder.addFolder("Camera").add(cameraHelper, "visible", false)
    helperFolder.open()

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
    newFilmPassFolder.add((<any>filmPass.uniforms).grayscale, 'value', 0, 1, 1).name('grayscale').onChange((value) => Data.FilmPass.grayscale = value)
    newFilmPassFolder.add((<any>filmPass.uniforms).nIntensity, 'value', 0, 1).name('noise intensity').onChange((value) => Data.FilmPass.nIntensity = value)
    // TODO: no-impact properties???
    // newFilmPassFolder.add((<any>filmPass.uniforms).sIntensity, 'value', 0, 1).name('scanline intensity').onChange((value) => Data.FilmPass.sIntensity = value)
    // newFilmPassFolder.add((<any>filmPass.uniforms).sCount, 'value', 0, 1000).name('scanline count').onChange((value) => Data.FilmPass.sCount = value)
    newFilmPassFolder.open();
    postProcessingFolder.open()
}

function switchScene(scenceIndex: number) {
    const currentTask: any = Array.from(Tasks)[scenceIndex][0]
    if (!currentTask.isInitialized) {
        currentTask.init()
    }

    // destroy Dat GUI for previous scene (if it exists)
    if (typeof (Array.from(Tasks)[currentSceneIndex][0].gui) !== 'undefined') {
        (Array.from(Tasks)[currentSceneIndex][0].gui as GUI).destroy()
    }

    currentSceneIndex = scenceIndex
    // create Dat GUI for current scene
    currentTask.createDatGUI()

    currentScene = currentTask.scene
    // update source link corresponding to current task (scene)
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[scenceIndex][1]
    currentScene.add(axesHelper)
    currentScene.add(gridHelper)
    currentScene.add(cameraHelper)

    updatePostProcessing()
}

function updatePostProcessing() {
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
        Data.FilmPass.nIntensity,
        Data.FilmPass.sIntensity,
        Data.FilmPass.sCount,
        Data.FilmPass.grayscale
    );
    filmPass.renderToScreen = true;
    composer.addPass(filmPass);

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

function animate() {
    if (renderer.xr.isPresenting) {
        renderer.setAnimationLoop(animate)
    } else {
        requestAnimationFrame(animate)
    }

    render()
    // controls.update()
    for (let i = 0; i < statsGUIs.length; i++) {
        statsGUIs[i].update()
    }
}

function render() {
    // only pause updating not rendering
    if (!pause) {
        Array.from(Tasks)[currentSceneIndex][0].render()
    }
    // renderer.render(currentScene, camera)
    composer.render()
}

/* EVENTS */
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // render()
}

/* Buttons to handle scene switch */
const taskButtons = document.querySelectorAll(".task")
const description = document.querySelector("#info")!
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        description.innerHTML = taskButtons[i].innerHTML
        switchScene(i)
    })
}


/* END EVENTS */

/* BUTTONS */
const sourceButton: HTMLElement = document.getElementById('source-link')!
sourceButton.onclick = function () {
    window.open(
        sourceLink,
        '_blank'
    )
}

const captureButton = document.querySelector('#screenshot')!
captureButton.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
});

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
pauseButton.addEventListener('click', function () {
    pauseIcon.classList.toggle('fa-pause')
    pauseIcon.classList.toggle('fa-play')
    pause = !pause
});

const audioButton = document.querySelector("#audio")!
const audioIcon = document.querySelector("#audio-icon")!
audioButton.addEventListener('click', function () {
    audioIcon.classList.toggle('fas-volume-mute')
    audioIcon.classList.toggle('fa-volume-up')
    muted = !muted
})

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