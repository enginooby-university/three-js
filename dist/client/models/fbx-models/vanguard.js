import { FBXModel } from './fbx-model.js';
export class Vanguard extends FBXModel {
    constructor(fbxLoader, x, y, z) {
        super(fbxLoader, "vanguard", 0.045, x, y, z);
    }
    loadModel(fbxLoader) {
        this.loadFBXModel(fbxLoader, // animationActions[0]
        () => this.loadFBXAnimation(fbxLoader, 'vanguard@samba-dancing', [0], // animationActions[1]
        () => this.loadFBXAnimation(fbxLoader, 'vanguard@belly-dancing', [], // animationActions[2]
        () => this.loadFBXAnimation(fbxLoader, 'vanguard@goofy-running', [0]))));
    }
}
