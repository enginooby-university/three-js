class Helper {
    constructor() { }

    public static toRadian(degree: number): number {
        return degree * Math.PI / 180
    }

    public static toDegree(radian: number): number {
        return radian * 180 / Math.PI
    }
}

export default Helper;