import { FBXModel } from './fbx-model.js';
export class Pearl extends FBXModel {
    constructor(fbxLoader, x, y, z) {
        super(fbxLoader, x, y, z);
    }
    initInfo() {
        this.name = "pearl";
        this.scale = 0.045;
        this.animations = {
            "sitting-talking": [],
            "sitting-rubbing-arm": [],
            "sitting-dodges": []
        };
    }
}
