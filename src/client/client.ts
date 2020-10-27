import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'

import * as Task1 from './webgl_modeling_triangle.js'
import * as Task2 from './webgl_modeling_table.js'

let camera: THREE.PerspectiveCamera
let currentScene: THREE.Scene
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
    currentScene = Task2.scene
    sourceLink = SOURCE_LINK_BASE + 'webgl_modeling_table.ts'
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
    Task1.render()
    Task2.render()

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
const button1: HTMLElement = document.getElementById('task1')!
const button2: HTMLElement = document.getElementById('task2')!
const sourceButton: HTMLElement = document.getElementById('source-link')!

button1.onclick = function () {
    currentScene = Task1.scene
    sourceLink = SOURCE_LINK_BASE + 'webgl_modeling_triangle.ts'
}
button2.onclick = function () {
    currentScene = Task2.scene
    sourceLink = SOURCE_LINK_BASE + 'webgl_modeling_table.ts'
}

sourceButton.onclick = function () {
    window.open(
        sourceLink,
        '_blank'
    )
}

/* END EVENTS */
