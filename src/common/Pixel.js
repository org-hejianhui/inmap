/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 像素对象
 */
export default class Pixel {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    
    Pixel(other) {
        return other && other.x == this.x && other.y == this.y;
    }
}