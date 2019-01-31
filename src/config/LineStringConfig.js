/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 线路的绘画配置类
 */
export default {
    tooltip: {
        show: false,
        formatter: '{count}',
        customClass: 'zcmap-tooltip-black', //是否自定义样式
        offsets: {
            top: 5,
            left: 12,
        }
    },
    style: {
        normal: {
            borderColor: 'rgba(50, 50, 255, 0.8)',
            borderWidth: 0.05,
            lineOrCurive: null, //‘cure’ 曲线
            deltaAngle: -0.2
        },
        colors: [],
        splitList: [],
    },
    data: [],
    checkDataType: {
        name: false,
        count: false
    },
    selected: [], //设置选中
    event: {
        onMouseClick() {},
        onState() {

        }
    }
};