import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { FBXModel } from './fbx-model.js'

export class Vanguard extends FBXModel {
    constructor(fbxLoader: FBXLoader, x: number, y: number, z: number) {
        super(fbxLoader, x, y, z)
    }

    protected initInfo() {
        this.name = "vanguard"
        this.scale = 0.045
        this.animations = {
            "samba-dancing": [0],
            "belly-dancing": [],
            "goofy-running": [0]
        }
    }
}