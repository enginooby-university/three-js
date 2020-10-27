import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { Tasks } from './tasks.js'

let camera: THREE.PerspectiveCamera
let currentScene: THREE.Scene
let currentSceneIndex: number
const canvas: HTMLCanvasElement = document.getElementById("threejs-canvas") as HTMLCanvasElement
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
let statsGUIs: Stats[] = []
let controls: OrbitControls
let sourceLink: string

const SOURCE_LINK_BASE: string = 'https://github.com/enginoobz-university/three-js/tree/master/src/client/'
const STATS_WIDTH: string = '110%'
const STATS_HEIGHT: string = '110%'

init()
animate()

function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.z = 5

    renderer.setSize(window.innerWidth, window.innerHeight)

    document.body.appendChild(renderer.domElement)

    createStatsGUI()

    controls = new OrbitControls(camera, renderer.domElement)

    // default scene
    currentSceneIndex = 1
    currentScene = Array.from(Tasks)[currentSceneIndex][0].scene
    sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[currentSceneIndex][1]
}

function createStatsGUI() {
    for (let i = 0; i < 3; i++) {
        const statsGUI = Stats()
        statsGUI.showPanel(i); // 0: fps, 1: ms, 2: mb, 3+: custom
        statsGUI.dom.style.top = `${60 * i + 50}px`
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
    controls.update()
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
for (let i = 0; i < taskButtons.length; i++) {
    taskButtons[i].addEventListener('click', function () {
        currentSceneIndex = i
        currentScene = Array.from(Tasks)[currentSceneIndex][0].scene
        sourceLink = SOURCE_LINK_BASE + Array.from(Tasks)[currentSceneIndex][1]
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
