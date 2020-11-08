import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { FBXModel } from './fbx-model.js'

export class Vanguard extends FBXModel {
    constructor(fbxLoader: FBXLoader, x: number, y: number, z: number) {
        super(fbxLoader, "vanguard", 0.045, x, y, z)
    }

    loadModel(fbxLoader: FBXLoader) {
        this.loadFBXModel(fbxLoader,    // animationActions[0]
            () => this.loadFBXAnimation(fbxLoader, 'vanguard@samba-dancing', [0],   // animationActions[1]
                () => this.loadFBXAnimation(fbxLoader, 'vanguard@belly-dancing', [],    // animationActions[2]
                    () => this.loadFBXAnimation(fbxLoader, 'vanguard@goofy-running', [0]))),    // animationActions[3]
        )
    }
}