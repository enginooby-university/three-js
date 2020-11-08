import { FBXModel } from './fbx-model.js';
export class Pearl extends FBXModel {
    constructor(fbxLoader, x, y, z) {
        super(fbxLoader, "pearl", 0.045, x, y, z);
    }
    loadModel(fbxLoader) {
        this.loadFBXModel(fbxLoader, // animationActions[0]
        () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-talking', [], // animationActions[1]
        () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-rubbing-arm', [], // animationActions[2]
        () => this.loadFBXAnimation(fbxLoader, 'pearl@sitting-dodges', []))));
    }
}
