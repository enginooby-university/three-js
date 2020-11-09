import { FBXModel } from './fbx-model.js';
export class Vanguard extends FBXModel {
    constructor(fbxLoader, x, y, z) {
        super(fbxLoader, x, y, z);
    }
    initInfo() {
        this.name = "vanguard";
        this.scale = 0.045;
        this.animations = {
            "samba-dancing": [0],
            "belly-dancing": [],
            "goofy-running": [0]
        };
    }
}
