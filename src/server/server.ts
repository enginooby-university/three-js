import express from "express"
import path from "path"
import http from "http"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        app.use('/jsm/controls/OrbitControls.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))
        app.use('/jsm/controls/DragControls.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/DragControls.js')))
        app.use('/jsm/controls/TransformControls.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/TransformControls.js')))
        app.use('/jsm/controls/PointerLockControls.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/PointerLockControls.js')))

        app.use('/jsm/libs/stats.module.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')))
        app.use('/jsm/libs/dat.gui.module.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')))
        app.use('/jsm/webxr/VRButton.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/webxr/VRButton.js')))

        app.use('/jsm/loaders/OBJLoader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/loaders/OBJLoader.js')))
        app.use('/jsm/loaders/MTLLoader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/loaders/MTLLoader.js')))
        app.use('/jsm/loaders/FBXLoader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/loaders/FBXLoader.js')))
        app.use('/jsm/libs/inflate.module.min.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/inflate.module.min.js')))
        app.use('/jsm/curves/NURBSCurve.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/curves/NURBSCurve.js')))
        app.use('/jsm/curves/NURBSUtils.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/curves/NURBSUtils.js')))

        app.use('/jsm/postprocessing/EffectComposer.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js')))
        app.use('/jsm/postprocessing/RenderPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js')))
        app.use('/jsm/postprocessing/BloomPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/BloomPass.js')))
        app.use('/jsm/postprocessing/ShaderPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js')))
        app.use('/jsm/postprocessing/FilmPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/FilmPass.js')))
        app.use('/jsm/shaders/FilmShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/FilmShader.js')))
        app.use('/jsm/shaders/CopyShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/CopyShader.js')))
        app.use('/jsm/postprocessing/MaskPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/MaskPass.js')))
        app.use('/jsm/postprocessing/Pass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/Pass.js')))
        app.use('/jsm/shaders/ConvolutionShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/ConvolutionShader.js')))
        app.use('/jsm/postprocessing/SMAAPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/SMAAPass.js')))
        app.use('/jsm/shaders/SMAAShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/SMAAShader.js')))

        this.server = new http.Server(app);
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log( `Server listening on port ${this.port}.` )
        })
    }
}

new App(port).Start()