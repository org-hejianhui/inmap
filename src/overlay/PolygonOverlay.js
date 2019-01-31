/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.30
 * Version: 0.0.1
 * Description: 不规则图形的绘画：可以设置背景颜色、高亮、边框宽度、边框颜色、还有鼠标事件等
 */
import Parameter from './base/Parameter.js';	// 接口定义，参数解析类
import Color from '../common/Color.js';	// 颜色工具类
import {
    clearPushArray	//  清空数组并添加新内容
} from '../common/Util.js';
import PolygonConfig from '../config/PolygonConfig.js';	// 不规则图形的配置类
import State from '../config/OnStateConfig.js';	// 图层状态类


export default class PolygonOverlay extends Parameter {
	
	/**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(ops) {
        super(PolygonConfig, ops);
        this._patchSplitList();
        this._state = null;
        this._customZoom = null;
        if (!this._styleConfig.isHighlight) {
            this._swopData = () => {};
        }
    }
    
    /**
     * 参数初始化
     */
    _parameterInit() {
        this._initLegend();
    }
    
    /**
     * 图例对象初始化
     */
    _initLegend() {
        const splitList = this._styleConfig.splitList;
        if (splitList.length === 0) {
            this._compileSplitList(this._styleConfig.colors, this._getTransformData());
        }
        this._patchSplitList();
        this._setlegend(this._legendConfig, this._styleConfig.splitList);
    }

	/**
     * 设置缩放比例
     * @param {Number} zoom 缩放比例
     */
    setCustomZoom(zoom) {
        this._customZoom = zoom;
        this._drawMap();
    }

    /**
     * 清空选中数据项
     */
    _clearSelectedList() {
        clearPushArray(this._selectItem);
    }

    /**
     * 获取选中的数据项
     */
    _getSelectedList() {
        return this._selectItem;
    }

    /**
     * 数据偏移转化
     * @param {*} distanceX X轴偏移
     * @param {*} distanceY Y轴偏移
     */
    _translation(distanceX, distanceY) {
        for (let i = 0; i < this._workerData.length; i++) {
            let geometry = this._workerData[i].geometry;
            let pixels = geometry.pixels;
            if (geometry.type == 'MultiPolygon') {
                for (let j = 0; j < pixels.length; j++) {
                    let pixelItem = pixels[j];
                    for (let k = 0, len = pixelItem.length; k < len; k++) {
                        let pixels = pixelItem[k];
                        for (let n = 0; n < pixels.length; n++) {
                            let pixel = pixels[n];
                            pixel[0] = pixel[0] + distanceX;
                            pixel[1] = pixel[1] + distanceY;
                        }
                    }
                }
            } else {
                for (let j = 0; j < pixels.length; j++) {
                    let pixelItem = pixels[j];
                    for (let k = 0, len = pixelItem.length; k < len; k++) {
                        let pixel = pixelItem[k];
                        pixel[0] = pixel[0] + distanceX;
                        pixel[1] = pixel[1] + distanceY;
                    }
                }
            }

            let labelPixels = geometry.labelPixels;
            for (let j = 0; j < labelPixels.length; j++) {
                let bestCell = labelPixels[j];
                if (bestCell) {
                    bestCell.x = bestCell.x + distanceX;
                    bestCell.y = bestCell.y + distanceY;
                }

            }

        }
        this.refresh();
    }

    /**
     * 设置选中数据
     * @param {Object} ops 选择数据项
     */
    setOptionStyle(ops) {
        this._setStyle(this._option, ops);
    }

    /**
     * 设置绘制状态
     * @param {*} val 
     */
    _setState(val) {
        this._state = val;
        this._eventConfig.onState.call(this, this._state);
    }

    /**
     * 样式发生变化会触发
     */
    _onOptionChange() {
        this._map && this._initLegend();
    }

    /**
     * 样式发生变化会触发
     */
    _onDataChange() {
        this._map && this._initLegend();
    }

    /**
     * 颜色等分策略
     * @param {} data 
     */
    _compileSplitList(colors, data) {
        if (colors.length <= 0) return;
        data = data.sort((a, b) => {
            return parseFloat(a.count) - parseFloat(b.count);
        });
        let splitCount = data.length / colors.length;
        let colorIndex = 0;
        let split = [];
        let star = 0,
            end = 0;

        for (let i = 0; i < data.length; i++) {

            if (i > splitCount * (colorIndex + 1)) {
                if (split.length == 0) {
                    star = data[0].count;
                }

                end = data[i].count;

                split.push({
                    start: star,
                    end: end,
                    backgroundColor: colors[colorIndex],
                });
                colorIndex++;
                star = data[i].count;
            }
        }

        data.length > 0 && split.push({
            start: star,
            end: null,
            backgroundColor: colors[colorIndex],
        });

        let result = [];
        for (let i = 0; i < split.length; i++) {
            let item = split[i];
            if (item.start != item.end) {
                item.backgroundColor = colors[result.length];
                result.push(item);
            }
        }
        this._styleConfig.splitList = result;
    }

    /**
     * 颜色修补策略
     */
    _patchSplitList() {
        let normal = this._styleConfig.normal;
        if (normal.borderWidth != null && normal.borderColor == null) {
            normal.borderColor = (new Color(normal.backgroundColor)).getRgbaValue();
        }
        let splitList = this._styleConfig.splitList;
        for (let i = 0; i < splitList.length; i++) {
            let condition = splitList[i];
            if ((condition.borderWidth != null || normal.borderColor != null) && condition.borderColor == null) {
                condition.borderColor = (new Color(condition.backgroundColor)).getRgbaValue();
            }
        }

    }

    /**
     * 绘制当前图层
     */
    _toDraw() {
        this._drawMap();
    }

    /**
     * 获取geometry几何对象中心点
     * @param {Object} geo geometry几何对象
     */
    _getGeoCenter(geo) {
        let minX = geo[0][0];
        let minY = geo[0][1];
        let maxX = geo[0][0];
        let maxY = geo[0][1];
        for (let i = 1; i < geo.length; i++) {
            minX = Math.min(minX, geo[i][0]);
            maxX = Math.max(maxX, geo[i][0]);
            minY = Math.min(minY, geo[i][1]);
            maxY = Math.max(maxY, geo[i][1]);
        }
        return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2];
    }

    /**
     * 获取geometry几何对象两点最大距离
     * @param {Object} geo geometry几何对象
     */
    _getMaxWidth(geo) {
        let minX = geo[0][0];
        let minY = geo[0][1];
        let maxX = geo[0][0];
        let maxY = geo[0][1];
        for (let i = 1; i < geo.length; i++) {
            minX = Math.min(minX, geo[i][0]);
            maxX = Math.max(maxX, geo[i][0]);
            minY = Math.min(minY, geo[i][1]);
            maxY = Math.max(maxY, geo[i][1]);
        }
        return maxX - minX;
    }

    /**
     * 查询选中列表的索引
     * @param {*} item 
     */
    _findIndexSelectItem(item) {
        let index = -1;
        if (item) {
            index = this._selectItem.findIndex(function (val) {
                return val && val.name == item.name;
            });
        }
        return index;
    }

    /**
     * 刷新当前图层
     */
    refresh() {

        this._setState(State.drawBefore);
        this._clearCanvas();
        this._drawPolygon(this.getRenderData());
        this._setState(State.drawAfter);
    }

    /**
     * 绘制当前图层画布
     */
    _drawMap() {
        this._setState(State.computeBefore);
        let parameter = {
            data: this._getTransformData(),
            enable: this._styleConfig.normal.label.enable,
            customZoom: this._customZoom
        };

        this._postMessage('PolygonOverlay.calculatePixel', parameter, (pixels, margin) => {
            if (this._eventType == 'onmoving') {
                return;
            }
            this._setWorkerData(pixels);
            this._setState(State.conputeAfter);
            this._translation(margin.left - this._margin.left, margin.top - this._margin.top);
            pixels = null, margin = null;
        });
    }

    /**
     * 根据鼠标像素坐标获取数据项
     * @param {*} x 
     * @param {*} y 
     */
    _getTarget(x, y) {
        let data = this.getRenderData();
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let geometry = item.geometry;
            let pixels = geometry.pixels;

            if (geometry.type == 'MultiPolygon') {
                for (let k = 0; k < pixels.length; k++) {
                    if (this._containPolygon(x, y, pixels[k])) {
                        return {
                            index: i,
                            item: item
                        };
                    }
                }

            } else {
                if (this._containPolygon(x, y, pixels)) {
                    return {
                        index: i,
                        item: item
                    };
                }

            }

            pixels = null, geometry = null, item = null;
        }

        return {
            index: -1,
            item: null
        };
    }

    /**
     * 绘制当前图层数据
     * @param {Object} pixelItem 数据集
     */
    _drawData(pixelItem) {
        if (pixelItem.length == 0)
            return;
        let pixel = pixelItem[0];
        this._ctx.moveTo(pixel[0], pixel[1]);
        for (let k = 1, len = pixelItem.length; k < len; k++) {
            let item = pixelItem[k];
            if (pixel[0] != item[0] || pixel[1] != item[1]) {
                this._ctx.lineTo(pixelItem[k][0], pixelItem[k][1]);
                pixel = item;
            }
        }
    }

    /**
     * 判断坐标点是否在当前数据画布内
     * @param {*} x 
     * @param {*} y 
     * @param {*} pixels 
     */
    _containPolygon(x, y, pixels) {
        let outerRace = false;
        for (let j = 0; j < pixels.length; j++) {
            this._ctx.beginPath();
            let pixelItem = pixels[j];
            if (j == 0) {
                this._drawData(pixelItem);
                this._ctx.closePath();
                if (this._ctx.isPointInPath(x * this._devicePixelRatio, y * this._devicePixelRatio)) {
                    outerRace = true;
                } else {
                    return false;
                }
            } else {

                this._drawData(pixelItem);
                this._ctx.closePath();
                //内环包含
                if (this._ctx.isPointInPath(x * this._devicePixelRatio, y * this._devicePixelRatio)) {
                    return false;
                }
            }

        }
        return outerRace;
    }

    /**
     * 绘制几何画布
     * @param {*} pixels 数据集
     * @param {*} style 画布样式
     */
    _drawPath(pixels, style) {

        for (let j = 0; j < pixels.length; j++) {
            this._ctx.save();   // 保存当前环境的状态
            this._ctx.beginPath();  // 起始一条路径，或重置当前路径
            let pixelItem = pixels[j];
            if (j == 0) {
                this._drawData(pixelItem);
                this._ctx.closePath();  // 创建从当前点回到起始点的路径
                this._ctx.fill();   // 填充当前绘图（路径）
            } else {
                this._drawData(pixelItem);
                this._ctx.clip();   // 从原始画布剪切任意形状和尺寸的区域
                this._clearCanvas();
            }
            this._ctx.strokeStyle = style.borderColor;  // 设置或返回用于笔触的颜色、渐变或模式
            this._ctx.lineWidth = style.borderWidth;    // 置或返回当前的线条宽度
            this._ctx.stroke(); // 绘制已定义的路径
            this._ctx.restore();    // 返回之前保存过的路径状态和属性
            pixelItem = null;

        }
    }

    /**
     * 绘制面几何对象
     * @param {Object} data 数据集
     */
    _drawPolygon(data) {
        this._ctx.lineCap = 'round';
        this._ctx.lineJoin = 'round';
        this._ctx.miterLimit = 4;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let geometry = item.geometry;
            let pixels = geometry.pixels;
            let style = this._setDrawStyle(item, true, i);
            this._ctx.beginPath();
            this._ctx.shadowColor = style.shadowColor || 'transparent';
            this._ctx.shadowBlur = style.shadowBlur || 10;
            this._ctx.shadowOffsetX = 0;
            this._ctx.shadowOffsetY = 0;
            this._ctx.fillStyle = style.backgroundColor;
            if (geometry.type == 'MultiPolygon') {
                for (let k = 0; k < pixels.length; k++) {
                    this._drawPath(pixels[k], style);
                }

            } else {
                this._drawPath(pixels, style);
            }
            style = null, pixels = null, geometry = null, item = null;
            this._ctx.closePath();
        }

        if (this._styleConfig.normal.label.show) {
            for (let i = 0; i < data.length; i++) {
                let item = data[i];
                let geometry = item.geometry;
                let pixels = geometry.pixels;
                let style = this._setDrawStyle(item, true, i);
                let labelPixels = geometry.labelPixels;
                this._ctx.shadowBlur = 0;
                this._ctx.lineWidth = style.label.lineWidth;
                this._ctx.font = style.label.font;
                this._ctx.fillStyle = style.label.color;
                for (let j = 0; j < labelPixels.length; j++) {
                    let bestCell = labelPixels[j];
                    this._ctx.beginPath();
                    let width = this._ctx.measureText(item.name).width;
                    if (geometry.type == 'MultiPolygon') {
                        let maxPixels = [];
                        for (let k = 0; k < pixels.length; k++) {
                            let item = pixels[k][0];
                            if (item.length > maxPixels.length) {
                                maxPixels = item;
                                bestCell = labelPixels[k];
                            }
                            item = null;
                        }
                        if (bestCell && item.name && this._getMaxWidth(maxPixels) > width) {
                            this._ctx.fillText(item.name, bestCell.x - width / 2, bestCell.y);
                        }
                        maxPixels = null;
                    } else {
                        if (bestCell && item.name && this._getMaxWidth(pixels[j]) > width) {
                            this._ctx.fillText(item.name, bestCell.x - width / 2, bestCell.y);
                        }
                    }

                    bestCell = null, width = null;
                }
                labelPixels = null;
            }

        }

    }
}