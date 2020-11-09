import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { FBXModel } from './fbx-model.js'

export class Pearl extends FBXModel {
    constructor(fbxLoader: FBXLoader, x: number, y: number, z: number) {
        super(fbxLoader, x, y, z)
    }

    protected initInfo(){
        this.name = "pearl"
        this.scale = 0.045
        this.animations = {
            "sitting-talking": [],
            "sitting-rubbing-arm": [],
            "sitting-dodges": []
        }
    }
}