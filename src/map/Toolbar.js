/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 地图工具实例对象
 */
export default class Toolbar {

    /**
     * 构造函数
     * @param {object} mapDom 对象
     */
    constructor(mapDom) {
        let container = this._create(mapDom);
        let legendContainer = this._createLegendContainer(container);
        return {
            container,
            legendContainer,
        };
    }
    /**
     * 创建工具栏dom
     * @param {object} mapDom 
     */
    _create(mapDom) {
        let div = document.createElement('div');
        div.classList.add('inmap-container');
        mapDom.appendChild(div);
        return div;
    }

    /**
     * 创建图例dom
     * @param {object} parentDom 
     */
    _createLegendContainer(parentDom) {
        let div = document.createElement('div');
        div.classList.add('inmap-legend-container');
        parentDom.appendChild(div);
        return div;
    }
}