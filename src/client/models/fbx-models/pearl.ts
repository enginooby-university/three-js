import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { FBXModel } from './fbx-model.js'

export class Pearl extends FBXModel {
    constructor(fbxLoader: FBXLoader, x: number, y: number, z: number) {
        super(fbxLoader, "pearl", 0.045, x, y, z)
    }

    loadModel(fbxLoader: FBXLoader) {
        this.loadFBXModel(fbxLoader,    // animationActions[0]
            () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-talking', [],   // animationActions[1]
                () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-rubbing-arm', [],    // animationActions[2]
                    () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-dodges', []))),    // animationActions[3]
        )
    }
}