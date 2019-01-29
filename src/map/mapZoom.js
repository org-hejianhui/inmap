/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.28
 * Version: 0.0.1
 * Description: 地图缩放实例对象
 */
export default class MapZoom {
    
    /**
     * 构造函数
     * @param {*} map 地图对象
     * @param {*} mapDom 缩放对象
     * @param {*} opts 缩放级别
     */
    constructor(map, mapDom, opts) {
        this._map = map;
        this._mapDom = mapDom;
        this._zoom = opts;
        this._confine = {
            min: 3,
            max: 18
        };
        this._createDom();
    }

    /**
     * 创建地图缩放对象Dom
     */
    _createDom() {
        let div = document.createElement('div');
        div.classList.add('zcmap-scale-group');
        div.innerHTML = '<a>+</a > <a>-</a >';
        this._mapDom.appendChild(div);
        this._event(div);
        this.setButtonState();
    }

    /**
     * 设置按钮状态
     */
    setButtonState() {
        let doms = this._mapDom.querySelectorAll('.zcmap-scale-group a');
        let zoom = this._map.getZoom();

        if (zoom >= this._zoom.max || zoom >= this._confine.max) {
            doms[0].setAttribute('disabled', 'true');
        } else {
            doms[0].removeAttribute('disabled');
        }
        if (zoom <= this._zoom.min || zoom <= this._confine.min) {
            doms[1].setAttribute('disabled', 'true');
        } else {
            doms[1].removeAttribute('disabled');
        }

    }

    /**
     * 绑定事件
     * @param {object} div 
     */
    _event(div) {
        let doms = div.querySelectorAll('a');
        doms[0].addEventListener('click', () => {
            let zoom = this._map.getZoom();
            if (zoom < this._zoom.max && zoom < this._confine.max) {
                this._map.zoomIn();
            }
             

        });
        doms[1].addEventListener('click', () => {
            let zoom = this._map.getZoom();
            if (zoom > this._zoom.min && zoom > this._confine.min) {
                this._map.zoomOut();
            }
            
        });


    }
}