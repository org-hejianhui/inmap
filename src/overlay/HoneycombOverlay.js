/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 蜂窝聚合（跟网格聚合类似，只是聚合的图行不同），已聚合的方式展示数据的分布状态。zcmap的算法都在worker（多线程）内运算，性能优越。 通常数据量越大，效果就越好（建议数据控制在1W~10W之间）
 */
import Parameter from './base/Parameter.js';    // 接口定义，参数解析类
import HoneycombConfig from './../config/HoneycombConfig.js';   // 蜂窝聚合配置类
import State from './../config/OnStateConfig';  // 绘制图层状态类

export default class HoneycombOverlay extends Parameter {
    
    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super(HoneycombConfig, ops);
        this._state = null;
        this._mpp = {};
        this._drawSize = 0;
    }

    /**
     * 设置当前样式，会造成画布重绘
     * @param {Object} ops HeatOverlayOption
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }

    /**
     * 设置画布绘制状态
     * @param {Number} val 状态
     */
    _setState(val) {
        this._state = val;
        this._eventConfig.onState.call(this, this._state);
    }

    /**
     * 绘制当前图层
     */
    draw() {
        this._toDraw();
    }

    /**
     * 刷新当前图层
     */
    refresh() {
        this._setState(State.drawBefore);
        this._drawRec();
        this._setState(State.drawAfter);
    }

    /**
     * 绘制当前图层
     */
    _toDraw() {
        this._drawMap();
    }

    /**
     * 样式发生变化会触发
     */
    _onOptionChange() {
        this._map && this._createColorSplit();
    }

    /**
     * 样式发生变化会触发
     */
    _onDataChange() {
        this._map && this._createColorSplit();
    }

    /**
     * 计算像素
     */
    _calculateMpp() {
        let zoom = this._map.getZoom();
        if (this._mpp[zoom]) {
            return this._mpp[zoom];
        } else {
            this._mpp[zoom] = this._getMpp();
            return this._mpp[zoom];
        }
    }

    /**
     * 获得每个像素对应多少米	
     */
    _getMpp() {
        let mapCenter = this._map.getCenter();
        let assistValue = 10;
        let cpt = new BMap.Point(mapCenter.lng, mapCenter.lat + assistValue);
        let dpx = Math.abs(this._map.pointToPixel(mapCenter).y - this._map.pointToPixel(cpt).y);
        return this._map.getDistance(mapCenter, cpt) / dpx;
    }

    /**
     * 绘制图层画布
     */
    _drawMap() {
        this._clearData();
        let {
            normal,
            type
        } = this._styleConfig;
        let zoom = this._map.getZoom();
        let mapCenter = this._map.getCenter();
        let mapSize = this._map.getSize();

        let zoomUnit = Math.pow(2, 18 - zoom);
        let mercatorProjection = this._map.getMapType().getProjection();
        let mcCenter = mercatorProjection.lngLatToPoint(mapCenter);

        let nwMcX = mcCenter.x - mapSize.width / 2 * zoomUnit;
        let nwMc = new BMap.Pixel(nwMcX, mcCenter.y + mapSize.height / 2 * zoomUnit);
        let size = 0;

        if (normal.unit == 'px') {
            size = normal.size * zoomUnit;
        } else if (normal.unit == 'm') {
            let mpp = this._calculateMpp();
            if (mpp == 0 || isNaN(mpp)) {
                return;
            }
            size = (normal.size / mpp) * zoomUnit;
        } else {
            throw new TypeError('inMap: style.normal.unit must be is "meters" or "px" .');
        }

        let params = {
            points: this._data,
            size: size,
            type: type,
            nwMc: nwMc,
            zoomUnit: zoomUnit,
            mapSize: mapSize,
            mapCenter: mapCenter,
            zoom: zoom
        };
        this._setState(State.computeBefore);

        this._postMessage('HoneycombOverlay.toRecGrids', params, (gridsObj) => {
            if (this._eventType == 'onmoving') {
                return;
            }
            this._canvasResize();
            this._setState(State.conputeAfter);

            this._workerData = gridsObj.grids;
            this._drawSize = size / zoomUnit;

            if (this._eventType != 'onmoveend' || this._styleConfig.splitList == null || this._styleConfig.splitList.length < this._styleConfig.colors.length) {
                this._createColorSplit();
            }
            this.refresh();
            gridsObj = null;

        });
    }

    /**
     * 创建当前图层颜色等分策略
     */
    _createColorSplit() {
        this._styleConfig.colors.length > 0 && this._compileSplitList(this._workerData);
        this._setlegend(this._legendConfig, this._styleConfig.splitList);
    }

    /**
     * 颜色等分策略
     * @param {} data 
     */
    _compileSplitList(data) {

        let colors = this._styleConfig.colors;
        if (colors.length < 0 || data.length <= 0) return;
        data = data.sort((a, b) => {
            return parseFloat(a.count) - parseFloat(b.count);
        });
        let mod = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];


        let colorMod = mod.slice(0, colors.length).reverse();
        let sunMod = colorMod.reduce((sum, val) => {
            return sum + val;
        }, 0);
        let split = [];
        let star = 0,
            end = 0,
            sign = 0,
            length = data.length;

        for (let i = 0; i < colorMod.length; i++) {
            if (split.length == 0) {
                star = data[0].count;
            } else {
                star = split[i - 1].end;
            }
            if (i == colorMod.length - 1) {
                end = null;
            } else {
                sign = parseInt((colorMod[i] / sunMod) * length) + sign;
                end = data[sign].count;
            }

            split.push({
                start: star,
                end: end,
                backgroundColor: colors[i]
            });

        }
        let result = [];
        for (let i = 0; i < split.length; i++) {
            let item = split[i];
            if (item.start != item.end) {
                item.backgroundColor = colors[result.length];
                result.push(item);
            }
        }
        split = [];

        this._styleConfig.splitList = result;

    }

    /**
     * 查询选中列表的索引
     * @param {*} item 
     */
    _findIndexSelectItem(item) {
        let index = -1;
        if (item) {
            index = this._selectItem.findIndex(function (val) {
                return val && val.x == item.x && val.y == item.y;
            });
        }
        return index;
    }

     /**
     * 根据数据项获取样式配置
     * @param {Object} item 数据项
     * @param {*} i 变量
     */
    _getStyle(item, i) {
        return this._setDrawStyle(item, true, i);
    }

     /**
     * 根据鼠标像素坐标获取数据项
     * @param {*} x 
     * @param {*} y 
     */
    _getTarget(mouseX, mouseY) {
        let gridStep = this._drawSize;
        let mapSize = this._map.getSize();

        for (let i = 0; i < this._workerData.length; i++) {
            let item = this._workerData[i];
            let x = item.x;
            let y = item.y;
            if (item.list.length > 0 && x > -gridStep && y > -gridStep && x < mapSize.width + gridStep && y < mapSize.height + gridStep) {
                this._ctx.beginPath();
                this._ctx.moveTo(x, y - gridStep / 2);
                this._ctx.lineTo(x + gridStep / 2, y - gridStep / 4);
                this._ctx.lineTo(x + gridStep / 2, y + gridStep / 4);
                this._ctx.lineTo(x, y + gridStep / 2);
                this._ctx.lineTo(x - gridStep / 2, y + gridStep / 4);
                this._ctx.lineTo(x - gridStep / 2, y - gridStep / 4);
                this._ctx.closePath();

                if (this._ctx.isPointInPath(mouseX * this._devicePixelRatio, mouseY * this._devicePixelRatio)) {
                    return {
                        index: i,
                        item: item
                    };
                }
            }
        }
        return {
            index: -1,
            item: null
        };
    }

    /**
     * 绘制多边形
     */
    _drawRec() {
        this._clearCanvas();
        let mapSize = this._map.getSize();
        let gridsW = this._drawSize;

        let style = this._styleConfig.normal;
        this._ctx.shadowOffsetX = 0;
        this._ctx.shadowOffsetY = 0;
        for (let i = 0; i < this._workerData.length; i++) {
            let item = this._workerData[i];
            let x = item.x;
            let y = item.y;
            if (item.list.length > 0 && x > -gridsW && y > -gridsW && x < mapSize.width + gridsW && y < mapSize.height + gridsW) {
                let drawStyle = this._getStyle(item, i);
                this._drawLine(x, y, gridsW - style.padding, drawStyle, this._ctx);
            }
        }
    }

    /**
     * 绘制线
     * @param {*} x 
     * @param {*} y 
     * @param {*} gridStep 
     * @param {*} drawStyle 
     * @param {*} ctx 
     */
    _drawLine(x, y, gridStep, drawStyle, ctx) {

        ctx.beginPath();
        if (drawStyle.shadowColor) {
            this._ctx.shadowColor = drawStyle.shadowColor || 'transparent';
            this._ctx.shadowBlur = drawStyle.shadowBlur || 10;
        } else {
            this._ctx.shadowColor = 'transparent';
            this._ctx.shadowBlur = 0;
        }
        ctx.fillStyle = drawStyle.backgroundColor;
        ctx.moveTo(x, y - gridStep / 2);
        ctx.lineTo(x + gridStep / 2, y - gridStep / 4);
        ctx.lineTo(x + gridStep / 2, y + gridStep / 4);
        ctx.lineTo(x, y + gridStep / 2);
        ctx.lineTo(x - gridStep / 2, y + gridStep / 4);
        ctx.lineTo(x - gridStep / 2, y - gridStep / 4);
        ctx.fill();
        ctx.closePath();
    }
}