"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const port = 3000;
class App {
    constructor(port) {
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        app.use('/build/three.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/build/three.module.js')));
        app.use('/cannon/build/cannon.min.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/cannon/build/cannon.min.js')));
        app.use('/jsm/controls/OrbitControls.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')));
        app.use('/jsm/controls/DragControls.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/DragControls.js')));
        app.use('/jsm/controls/TransformControls.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/TransformControls.js')));
        app.use('/jsm/controls/PointerLockControls.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/PointerLockControls.js')));
        app.use('/jsm/libs/stats.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')));
        app.use('/jsm/libs/dat.gui.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')));
        app.use('/jsm/webxr/VRButton.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/webxr/VRButton.js')));
        app.use('/jsm/loaders/OBJLoader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/OBJLoader.js')));
        app.use('/jsm/loaders/MTLLoader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/MTLLoader.js')));
        app.use('/jsm/loaders/FBXLoader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/FBXLoader.js')));
        app.use('/jsm/libs/inflate.module.min.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/inflate.module.min.js')));
        app.use('/jsm/curves/NURBSCurve.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/curves/NURBSCurve.js')));
        app.use('/jsm/curves/NURBSUtils.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/curves/NURBSUtils.js')));
        app.use('/jsm/postprocessing/EffectComposer.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js')));
        app.use('/jsm/postprocessing/RenderPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js')));
        app.use('/jsm/postprocessing/OutlinePass', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/OutlinePass.js')));
        app.use('/jsm/postprocessing/BloomPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/BloomPass.js')));
        app.use('/jsm/postprocessing/ShaderPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js')));
        app.use('/jsm/postprocessing/FilmPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/FilmPass.js')));
        app.use('/jsm/shaders/FilmShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/FilmShader.js')));
        app.use('/jsm/shaders/CopyShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/CopyShader.js')));
        app.use('/jsm/postprocessing/MaskPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/MaskPass.js')));
        app.use('/jsm/postprocessing/Pass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/Pass.js')));
        app.use('/jsm/shaders/ConvolutionShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/ConvolutionShader.js')));
        app.use('/jsm/postprocessing/SMAAPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/SMAAPass.js')));
        app.use('/jsm/shaders/SMAAShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/SMAAShader.js')));
        this.server = new http_1.default.Server(app);
        this.io = new socket_io_1.default.Server(this.server);
    }
    Start() {
        this.server.listen(process.env.PORT || this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
        this.io.on("connection", (socket) => {
            console.log(`User connected: ${socket.id}`);
            socket.emit("message", `Welcome ${socket.id}`);
            socket.broadcast.emit("message", "Everybody, say hello to " + socket.id);
            socket.on("changeSceneData", (data) => {
                // emit to all sockets except the socket making change
                socket.broadcast.emit("updateSceneData", data);
                // emit to all sockets
                // this.io.sockets.emit("updateSceneData", data)
            });
            socket.on("disconnect", () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }
}
new App(port).Start();
//# sourceMappingURL=server.js.map