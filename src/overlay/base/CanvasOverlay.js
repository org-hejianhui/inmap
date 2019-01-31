/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.29
 * Version: 0.0.1
 * Description: 图层绘制类
 */
import BaseClass from './BaseClass';    // ZC框架的基类
import Legend from '../../map/Legend';  // 地图图例对象
import Throttle from '../../common/Throttle';   // 函数节流控制工具类
import {
    setDevicePixelRatio,    // 设置设备像素
    isString,   // 是否是字符串
    isArray,    // 判断目标参数是否Array对象
    detectmob,  // 检查设备类型
    isFunction  // 是否是函数
} from '../../common/Util';
import {
    WhiteLover, // 白色
    Blueness    // 蓝色
} from '../../config/MapStyleConfig';   // 地图样式风格
import Toolbar from '../../map/Toolbar';    // 地图工具实例对象
import ToolTip from '../../map/ToolTip';    // 地图提示框对象
let zIndex = 0;
const isMobile = detectmob();   // 是否是移动设备

export default class CanvasOverlay extends BaseClass {
    constructor(opts) {
        super();
        this._ctx = null; // canvas对象
        this._eventType = 'moveend'; // 事件类型，鼠标移动结束
        this._map = null;   // 地图对象
        this._container = null; // 容器对象
        this._throttle = new Throttle();    // 事件分流控制
        this._tOnResize = this._tOnResize.bind(this);   // 对象调整大小事件
        this._tOnMoveend = this._tOnMoveend.bind(this); // 对象移动事件
        this._tOnZoomstart = this._tOnZoomstart.bind(this); // 开始缩放对象发生事件
        this._tOnZoomend = this._tOnZoomend.bind(this); // 结束缩放对象发生事件
        this._tOnMoving = this._tOnMoving.bind(this);   // 该对象的位置正在变（正在用鼠标拖动，还没松开鼠标）
        this._tMousemove = this._tMousemove.bind(this); // 鼠标经过该对象（移动鼠标的时候，经过该对象）
        this._tMouseClick = this._tMouseClick.bind(this);   // 鼠标单击时发生事件
        this._resize = this._toDraw.bind(this); // 重新绘制事件
        this._throttle.on('throttle', this._resize); // 分流控制绘制
        this._devicePixelRatio = window.devicePixelRatio; // 设备像素
        this._repaintEnd = opts && opts.repaintEnd; //重绘回调
        this._animationFlag = true;
        this._isDispose = false; //是否已销毁
        this._margin = {
            left: 0,
            top: 0
        };
        this._zIndex = !opts || opts.zIndex == null ? zIndex += 10 : opts.zIndex;

    }

    /**
     * 图层绘制初始化
     * @param {Object} map 地图对象
     */
    initialize(map) {
        this._map = map;
        this._container = document.createElement('canvas');
        this._ctx = this._container.getContext('2d');
        this._margin.left = -this._map.offsetX;
        this._margin.top = -this._map.offsetY;
        this._container.style.cssText = `position:absolute;left:${this._margin.left}px;top:${this._margin.top}px;z-index:${this._zIndex};`;
        map.getPanes().mapPane.appendChild(this._container);
        this._setCanvasSize();
        map.addEventListener('resize', this._tOnResize);
        map.addEventListener('moveend', this._tOnMoveend);
        map.addEventListener('moving', this._tOnMoving);
        map.addEventListener('zoomstart', this._tOnZoomstart);
        map.addEventListener('zoomend', this._tOnZoomend);
        map.addEventListener('mousemove', this._tMousemove);
        if (isMobile) {
            map.addEventListener('touchstart', this._tMouseClick);
        } else {
            map.addEventListener('click', this._tMouseClick);
        }

        if (!map._zcmapToolBar) {
            map._zcmapToolBar = new Toolbar(map.getContainer());
        }

        this.legend = new Legend(map._zcmapToolBar.legendContainer);
        this.toolTip = new ToolTip(map._zcmapToolBar.container);

        this._canvasInit();
        return this._container;

    }

    /**
     * 地图样式风格设置
     * @param {Object} skin 风格样式对象 
     */
    _tMapStyle(skin) {
        let styleJson = null;
        if (isString(skin)) {
            styleJson = skin == 'Blueness' ? Blueness : WhiteLover;
        } else if (isArray(skin)) {
            styleJson = skin;
        }
        skin && this._map && this._map.setMapStyle({
            styleJson: styleJson
        });
    }

    /**
     * 图层重新绘制事件
     * @param {Object} event 
     */
    _tOnResize(event) {
        this._setCanvasSize();
        this._eventType = event.type;
        this._tDraw(this, event);
    }

    /**
     * 地图移动事件
     * @param {Object} event 
     */
    _tOnMoveend(event) {
        this._animationFlag = true;
        this._eventType = event.type;
    }

    /**
     * 开始缩放对象发生事件
     */
    _tOnZoomstart() {
        this._animationFlag = false;
        this._clearCanvas();
    }
    
    /**
     * 结束缩放对象发生事件
     * @param {Object} e 
     */
    _tOnZoomend(e) {
        this._animationFlag = true;
        this._eventType = e.type;
    }

    /**
     * 该对象的位置正在变（正在用鼠标拖动，还没松开鼠标）
     * @param {Object} e 
     */
    _tOnMoving(e) {
        this._animationFlag = false;
        this._eventType = e.type;
    }

    /**
     * 鼠标经过该对象（移动鼠标的时候，经过该对象）
     */
    _tMousemove() {
        /** 抽象方法 子类去实现 */

    }

    /**
     * 图层绘制初始化
     */
    _canvasInit() {
        /** 抽象方法 子类去实现*/
    }

    /**
     * 鼠标单击时发生事件
     */
    _tMouseClick() {
        /** 抽象方法 子类去实现*/
    }

    /**
     * 图层绘制方法
     */
    draw() {
        let eventType = this._eventType;
        if (eventType == 'onmoving') {
            this._canvasResize();
        } else {
            this._throttle.throttleEvent();
        }

    }
    
    _tDraw(me, event) {
        this._eventType = event.type;
        me.draw(event);
        this._repaintEnd && this._repaintEnd(this); //重绘回调
        me.keysss = true;
    }

    _toDraw() {
        /** 抽象方法 子类去实现*/
    }

    /**
     * canvas重置
     */
    _canvasResize() {
        let map = this._map;
        let container = this._container;
        let point = map.getCenter();
        let size = map.getSize();
        let pixel = map.pointToOverlayPixel(point);
        let left = parseInt(pixel.x - size.width / 2, 10);
        let top = parseInt(pixel.y - size.height / 2, 10);
        let containerDomStyle = container.style;
        this._translationIf(this._margin.left, this._margin.top, left, top);

        this._margin.left = left;
        this._margin.top = top;
        containerDomStyle.left = left + 'px';
        containerDomStyle.top = top + 'px';

        containerDomStyle = null;
        container = null;
        map = null;

    }
    _translationIf(oldLeft, oldTop, newLeft, newTop) {
        if (oldLeft != newLeft || oldTop != newTop) {
            this._translation(oldLeft - newLeft, oldTop - newTop);
        }
    }


    /*eslint-disable */

    _translation(distanceX, distanceY) {
        /**       
         * 抽象方法，子类去实现
         */
    }

    /*eslint-enable */

    _clearCanvas() {
        if (!this._map) return;

        let size = this._map.getSize();
        this._getContext().clearRect(0, 0, size.width, size.height); //调整画布
    }

    _setCanvasSize() {
        let size = this._map.getSize();
        this._container.width = size.width;
        this._container.height = size.height;
        setDevicePixelRatio(this._ctx);
    }
    _getContext() {
        return this._ctx;
    }
    /**
     * 设置overlay z-index
     */
    setZIndex(zIndex) {
        this._zIndex = zIndex;
        if (this._container) {
            this._container.style.zIndex = this._zIndex;
        }
    }

    _Tclear() {

    }
    _Tdispose() {

    }
    /**
     * 对象销毁
     */
    dispose() {
        this._throttle.dispose();
        this._removeWorkerMessage();
        if (this._map) {
            this._map.removeEventListener('resize', this._tOnResize);
            this._map.removeEventListener('moveend', this._tOnMoveend);
            this._map.removeEventListener('zoomstart', this._tOnZoomstart);
            this._map.removeEventListener('zoomend', this._tOnZoomend);
            this._map.removeEventListener('moving', this._tOnMoving);
            this._map.removeEventListener('mousemove', this._tMousemove);
            if (isMobile) {
                this._map.removeEventListener('touchstart', this._tMouseClick);
            } else {
                this._map.removeEventListener('click', this._tMouseClick);
            }
        }


        if (this.legend) {
            this.legend.dispose(this._map._zcmapToolBar.legendContainer);
            this.legend = null;
        }
        if (this.toolTip) {
            this.toolTip.dispose();
            this.toolTip = null;
        }

        this._Tclear();
        this._Tdispose();

        this._map.removeOverlay(this);
        let me = this;
        for (let key in me) {
            if (!isFunction(me[key])) {
                me[key] = null;
            }
        }
        me._isDispose = true;
        me = null;
    }
}