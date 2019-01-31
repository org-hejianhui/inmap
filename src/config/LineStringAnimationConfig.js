/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 线路的动画图层配置类
 */
export default {
    style: { 
        //移动点半径
        size: 0.5,
        //移动点颜色
        fillColor: 'rgba(255, 250, 250, 0.9)',    
        //移动点阴影大小
        shadowBlur: 0,
        fps: 20,
        lineOrCurve: 'curve',//curve or line
        deltaAngle: -0.2 // 偏移角度或切分间隔

    },
    data: [],
    checkDataType: {
        name: false,
        count: false
    },
};