/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.29
 * Version: 0.0.1
 * Description: 文字图层组件配置类，在地理位置上标记文字，可配置文字大小、颜色、背景阴影、以及鼠标事件等
 */
export default {
    tooltip: {
        show: false,
        formatter: '{count}',
        customClass: 'inmap-tooltip-black', //是否自定义样式
        offsets: {
            top: 5,
            left: 12,
        }
    },
    legend: {
        show: false
    },
    style: {
        normal: {
            font: '18px Arial',
            color: 'yellow',
            shadowColor: 'yellow',
            shadowBlur: 10
        },
        splitList: [],
        colors: []
    },
    data: [],
    checkDataType: {
        name: true,
        count: false
    },
    selected: [], //设置选中
    event: {
        multiSelect: false, //是否支持多选
        onMouseClick() {},
        onState() {

        }
    }
};