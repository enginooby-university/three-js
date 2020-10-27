import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'

import * as Task1 from './webgl_modeling_triangle.js'
import * as Task2 from './webgl_modeling_table.js'

let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
let statsGUIs: Stats[] = []
// let controls: OrbitControls

init()
animate()

function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.z = 5

    renderer.setSize(window.innerWidth, window.innerHeight)

    document.body.appendChild(renderer.domElement)

    createStatsGUI()

    // controls = new OrbitControls(camera, renderer.domElement)

    // default scene
    scene = Task2.scene
}

function createStatsGUI() {
    for (let i = 0; i < 3; i++) {
        const statsGUI = Stats()
        statsGUI.showPanel(i); // 0: fps, 1: ms, 2: mb, 3+: custom
        statsGUI.dom.style.top = `${60 * i + 30}px`
        statsGUIs.push(statsGUI)
        document.body.appendChild(statsGUI.dom)

        const children = statsGUI.dom.childNodes as NodeListOf<HTMLCanvasElement>
        children.forEach(child => {
            child.style.width = '110%'
            child.style.height = '110%'
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
    Task1.render()
    Task2.render()

    renderer.render(scene, camera)

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

button1.onclick = function () {
    scene = Task1.scene
}
button2.onclick = function () {
    scene = Task2.scene
}

/* END EVENTS */
