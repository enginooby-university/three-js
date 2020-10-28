import * as THREE from '/build/three.module.js'
import { Tasks } from './task_management.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import Stats from '/jsm/libs/stats.module.js'
import { GUI } from '/jsm/libs/dat.gui.module.js'
import * as DatHelper from './helpers/dat_helper.js'
import { VRButton } from '/jsm/webxr/VRButton.js'

let camera: THREE.PerspectiveCamera
const CAMERA_FOV: number = 50 //degrees
const CAMERA_NEAR: number = 0.1
const CAMERA_FAR: number = 1000

let currentScene: THREE.Scene
let currentSceneIndex: number = 0
const canvas: HTMLCanvasElement = document.getElementById("threejs-canvas") as HTMLCanvasElement
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
const gui = new GUI()
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

init()
animate()

function init() {
    camera = createCamera()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    document.body.appendChild(vrButton)
    vrButton.style.marginBottom = "80px"
    //document.body.appendChild(renderer.domElement)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.maxDistance = 300
    createStatsGUI()
    switchScene(2)
    createHelperGUIFolder()
    DatHelper.createCameraFolder(gui, camera, 'Perspective Camera')
}

function createCamera() {
    const newCamera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR)
    newCamera.position.z = 5
    newCamera.position.y = 3
    newCamera.position.x = 3
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

function switchScene(scenceIndex: number) {
    // destroy Dat GUI for previous scene (if it exists)
    if (typeof (Array.from(Tasks)[currentSceneIndex][0].gui) !== 'undefined') {
        (Array.from(Tasks)[currentSceneIndex][0].gui as GUI).destroy()
    }
    currentSceneIndex = scenceIndex
    // create Dat GUI for current scene
    Array.from(Tasks)[currentSceneIndex][0].createDatGUI()

    currentScene = Array.from(Tasks)[currentSceneIndex][0].scene
    // update source link corresponding to current task (scene)
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[currentSceneIndex][1]
    currentScene.add(axesHelper)
    currentScene.add(gridHelper)
    currentScene.add(cameraHelper)
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
    requestAnimationFrame(animate)
    render()
    // controls.update()
    for (let i = 0; i < statsGUIs.length; i++) {
        statsGUIs[i].update()
    }
}

function render() {
    Array.from(Tasks)[currentSceneIndex][0].render()
    renderer.render(currentScene, camera)
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

const sourceButton: HTMLElement = document.getElementById('source-link')!
sourceButton.onclick = function () {
    window.open(
        sourceLink,
        '_blank'
    )
}
/* END EVENTS */

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