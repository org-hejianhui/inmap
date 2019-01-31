 /**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 在地图上创建可编辑多边形,支持数万个点大数据围栏编辑
 */
 import CanvasOverlay from '../base/CanvasOverlay'; // 图层绘制类
 import PolygonOverlay from '../PolygonOverlay';    // 不规则图形的绘画
 import PointDragOverlay from './PointDragOverlay'; // 点拖拽绘制图层
 import config from '../../config/PolygonEditorConfig';     // 多边形编辑配置类
 import {
     merge, // 数组合并
     isPolyContains,    // 是否被包含
 } from '../../common/Util';

 export default class PolygonEditorOverlay2 extends CanvasOverlay {
     
    /**
	 * 构造函数
	 * @param {Object} opts 配置项
	 */
    constructor(opts) {
         super(opts);
         this._opts = merge(config, opts);
         this._eventConfig = this._opts.event;
         this._dragEndVirtual = this._dragEndVirtual.bind(this);
         this._dragEndPoint = this._dragEndPoint.bind(this);
         this._draggingPoint = this._draggingPoint.bind(this);
         this._draggingVirtual = this._draggingVirtual.bind(this);
         this._dblclickPoint = this._dblclickPoint.bind(this);
         this._dblclickFun = this._dblclickFun.bind(this);
         this._clickFun = this._clickFun.bind(this);
         this._mousemoveFun = this._mousemoveFun.bind(this);
         this._rightclick = this._rightclick.bind(this);
         this._polygonOverlay = null;
         this._pointOverlay = null;
         this._virtualPointOverlay = null;
         this._workerData = [];
         this._pointDataGroup = [];
         this._draggingPointTemp = null;
         this._draggingVirtualTemp = null;
         this._createTempCache = null;
         this._createIndex = -1;
         this.isCreate = false;

     }

     /**
     * 设置当前的图层的z-index值。注意：被and添加之后才能调用生效,zcmap默认是按照添加图层的顺序设置层级的
     * @param {Number} zIndex 索引值
     */
     setZIndex(zIndex) {
         this._zIndex = zIndex;
         if (this._container) this._container.style.zIndex = this._zIndex;

         this._polygonOverlay && this._polygonOverlay.setZIndex(this._zIndex + 1);
         this._pointOverlay && this._pointOverlay.setZIndex(this._zIndex + 2);
         this._virtualPointOverlay && this._virtualPointOverlay.setZIndex(this._zIndex + 4);
     }

     /**
      * 画布初始化
      */
     _canvasInit() {
         this._polygonOverlay = new PolygonOverlay({
             checkDataType: {
                 name: false,
                 count: false
             },
             style: this._opts.style.polygon,
             data: this._opts.data ? [this._toMutilPolygon(this._opts.data)] : [],
             event: {
                 onState: (state) => {
                     if (state == 3) {
                         this._workerData = this._polygonOverlay.getRenderData();
                         if (this._workerData.length == 0) {
                             this._workerData.push({
                                 geometry: {
                                     type: 'MultiPolygon',
                                     coordinates: [],
                                     pixels: [],
                                     labelPixels: []

                                 }
                             });
                         }
                         if (this._opts.style.isEdit && this.isCreate == false) {
                             this._setPointData();
                             this._setVirtualPointData();
                         } else {
                             this._clearPointOverlay();
                         }
                     }
                 },
                 onMouseClick: (event) => {
                     if (!this.isCreate) {
                         this._eventConfig.onMouseClick.call(this, event);
                     }

                 }
             },
             zIndex: this._zIndex + 1
         });

         this._map.addOverlay(this._polygonOverlay);

         this._pointOverlay = new PointDragOverlay({
             style: { ...this._opts.style.point,
                 ...{
                     isDrag: true
                 },
             },
             event: {
                 onDragEnd: this._dragEndPoint,
                 onDragging: this._draggingPoint,
                 onDblclick: this._dblclickPoint,
             },
             zIndex: this._zIndex + 2
         });
         this._map.addOverlay(this._pointOverlay);

         this._virtualPointOverlay = new PointDragOverlay({
             style: { ...this._opts.style.virtualPoint,
                 ...{
                     isDrag: true
                 },
             },
             event: {
                 onDragEnd: this._dragEndVirtual,
                 onDragging: this._draggingVirtual
             },
             zIndex: this._zIndex + 4
         });
         this._map.addOverlay(this._virtualPointOverlay);
         this._map.addEventListener('rightclick', this._rightclick);
     }

     /**
     * 设置当前样式，会造成画布重绘
     * @param {Object} ops 数据集
     */
     setOptionStyle(opts) {

         if (!opts) return;
         if (opts.data === undefined) {
             delete opts.data;
         }
         this._opts = merge(this._opts, opts);
         this._eventConfig = this._opts.event;
         this._polygonOverlay && this._polygonOverlay.setOptionStyle({
             style: this._opts.style.polygon
         });

         this._pointOverlay && this._pointOverlay.setOptionStyle({
             style: { ...this._opts.style.point,
                 ...{
                     isDrag: true
                 },
             }
         });
         this._virtualPointOverlay && this._virtualPointOverlay.setOptionStyle({
             style: { ...this._opts.style.virtualPoint,
                 ...{
                     isDrag: true
                 },
             }
         });
         if (opts.data !== undefined) {
             this.setPath(opts.data);
         }
     }

     /**
      * 清空数据
      */
     _wokerDataClear() {
         this._workerData = [{
             geometry: {
                 type: 'MultiPolygon',
                 coordinates: [],
                 pixels: [],
                 labelPixels: []

             }
         }];
     }

     /**
      * 创建多边形。 注意：会清空之前的数据
      */
     create() {

         this.isCreate = true;
         this._wokerDataClear();
         this._createTempCache = null;
         this._createIndex = -1;
         if (this._map) {
             this._polygonOverlay._setWorkerData(this._workerData);
             this._polygonOverlay.refresh();
             this._map.removeEventListener('click', this._clickFun);
             this._map.removeEventListener('dblclick', this._dblclickFun);
             this._map.removeEventListener('mousemove', this._mousemoveFun);
             this._map.addEventListener('click', this._clickFun);
             this._map.addEventListener('dblclick', this._dblclickFun);
             this._map.addEventListener('mousemove', this._mousemoveFun);
         }

     }

     /**
      * 设置多边形的数据
      * @param {Object} data 数据集
      */
     setPath(data) {
         this.isCreate = false;
         this._opts.data = data;
         this._wokerDataClear();
         this._pointDataGroup = [];
         this._draggingPointTemp = null;
         this._draggingVirtualTemp = null;
         this._createTempCache = null;
         this._createIndex = -1;
         this._polygonOverlay && this._polygonOverlay.setData(this._opts.data ? [this._toMutilPolygon(data)] : []);
     }

     /**
      * 开启编辑功能
      */
     enableEditing() {
         this.isCreate = false;
         this._opts.style.isEdit = true;
         this._map && this._map.removeEventListener('click', this._clickFun);
         this._map && this._map.removeEventListener('dblclick', this._dblclickFun);
         this._map && this._map.removeEventListener('mousemove', this._mousemoveFun);
         this._setPointData();
         this._setVirtualPointData();
     }

     /**
      * 关闭编辑功能
      */
     disableEditing() {
         this.isCreate = false;
         this._opts.style.isEdit = false;
         this._clearPointOverlay();
     }

     /**
      * 按像素平移
      * @param {*} x 
      * @param {*} y 
      */
     translationPixel(x, y) {
         if (this._workerData.length > 0) {
             for (let i = 0; i < this._workerData.length; i++) {
                 let geometry = this._workerData[i].geometry;
                 let pixels = geometry.pixels;
                 let coordinates = geometry.coordinates;
                 if (geometry.type == 'MultiPolygon') {
                     for (let j = 0; j < pixels.length; j++) {
                         let pixelItem = pixels[j];
                         for (let k = 0, len = pixelItem.length; k < len; k++) {
                             let pixels = pixelItem[k];
                             for (let n = 0; n < pixels.length; n++) {
                                 let pixel = pixels[n];
                                 let point = coordinates[j][k][n];
                                 pixel[0] = pixel[0] + x;
                                 pixel[1] = pixel[1] + y;

                                 let latlng = this._map.overlayPixelToPoint({
                                     x: pixel[0],
                                     y: pixel[1]
                                 });
                                 point[0] = latlng.lng;
                                 point[1] = latlng.lat;

                             }
                         }
                     }
                 }
             }
             this._polygonOverlay && this._polygonOverlay.refresh();
             this._eventConfig.onChange.call(this, 'translationPixel');
         }
     }

     /**
      * 移除鼠标移动事件
      */
     _removeMoveEvent() {
         if (!this._map) return;
         this._map.removeEventListener('click', this._clickFun);
         this._map.removeEventListener('dblclick', this._dblclickFun);
         this._map.removeEventListener('mousemove', this._mousemoveFun);
         this._map.removeEventListener('rightclick', this._rightclick);
     }

     /**
      * 释放对象
      */
     _Tdispose() {
         this._removeMoveEvent();
         this._map.removeOverlay(this._polygonOverlay);
         this._map.removeOverlay(this._pointOverlay);
         this._map.removeOverlay(this._virtualPointOverlay);
         this._polygonOverlay.dispose();
         this._pointOverlay.dispose();
         this._virtualPointOverlay.dispose();
     }

     /**
      * 返回多边形的GeoJSON数据
      */
     getPath() {
         if (this._workerData.length > 0) {
             let coordinates = JSON.parse(JSON.stringify(this._workerData[0].geometry.coordinates));
             if (coordinates.length > 0) {
                 return {
                     geometry: {
                         type: 'MultiPolygon',
                         coordinates: coordinates
                     }
                 };
             } else {
                 return null;
             }

         } else {
             return null;
         }
     }

     /**
      * 转换成多面几何数据集
      * @param {*} data 
      */
     _toMutilPolygon(data) {
         try {
             if (data && data.geometry.type == 'Polygon') {
                 data.geometry.type = 'MultiPolygon';
                 data.geometry.coordinates = [
                     data.geometry.coordinates
                 ];
             }
         } catch (error) {
             throw new TypeError('zcmap :data must be is \'MultiPolygon\' or \'Polygon\'');
         }
         return data;

     }

     /**
      * 点击事件
      * @param {*} event 
      */
     _clickFun(event) {
         if (!this.isCreate) return;


         if (!this._createTempCache) {
             this._createIndex++;
             this._createTempCache = {
                 coordinates: [
                     [event.point.lng, event.point.lat]
                 ],
                 pixels: [
                     [event.offsetX, event.offsetY]
                 ],
             };
         }
         let geoJSON = this._workerData[0];

         let currentCoordinate = geoJSON.geometry.coordinates[this._createIndex];
         let currentPixels = geoJSON.geometry.pixels[this._createIndex];

         if (!currentCoordinate) {
             geoJSON.geometry.coordinates.push([
                 []
             ]);
             geoJSON.geometry.pixels.push([
                 []
             ]);

             currentCoordinate = geoJSON.geometry.coordinates[this._createIndex];
             currentPixels = geoJSON.geometry.pixels[this._createIndex];
         }

         //外环
         if (currentPixels[0].length > 0) { //检查是否重复
             let pixels = currentPixels[0],
                 len = pixels.length,
                 pixel = pixels[len - 1];
             if (pixel[0] == event.offsetX && pixel[1] == event.offsetY) {
                 this._createTempCache.coordinates.push([event.point.lng, event.point.lat]);
                 this._createTempCache.pixels.push([event.offsetX, event.offsetY]);
                 return;
             }

         }

         currentCoordinate[0].push([event.point.lng, event.point.lat]);
         currentPixels[0].push([event.offsetX, event.offsetY]);

         this._polygonOverlay.refresh();

     }

     /**
      * 双击事件
      */
     _dblclickFun() {
         if (!this.isCreate) {
             return;
         }

         let geoJSON = this._polygonOverlay._workerData[0];

         let currentCoordinate = geoJSON.geometry.coordinates[this._createIndex];
         if (currentCoordinate[0].length <= 2) {
             //无效
             geoJSON.geometry.coordinates.splice(this._createIndex, 1);
             geoJSON.geometry.pixels.splice(this._createIndex, 1);

             this._polygonOverlay.refresh();
             console.log(geoJSON);
             this._createIndex--;
         } else {

             let index = this._isPolyContainsIndex(currentCoordinate[0], geoJSON, this._createIndex);
             if (index > -1) { //包含
                 geoJSON.geometry.coordinates[index].push(currentCoordinate[0]);
                 geoJSON.geometry.pixels[index].push(geoJSON.geometry.pixels[this._createIndex][0]);

                 geoJSON.geometry.coordinates.splice(this._createIndex, 1);
                 geoJSON.geometry.pixels.splice(this._createIndex, 1);
                 this._createIndex--;

                 this._polygonOverlay.refresh();
             }
             this._eventConfig.onCreated.call(this, event);

         }

         this._createTempCache = null;

     }

    /**
     * 是否包含索引
     * @param {*} lngLats 
     * @param {*} polygon 
     * @param {*} notIndex 
     */     
     _isPolyContainsIndex(lngLats, polygon, notIndex) {
         let coordinates = polygon.geometry.coordinates;
         for (let j = 0, len = coordinates.length; j < len; j++) {
             if (j != notIndex) {
                 let item = coordinates[j][0];

                 let lngs = [],
                     lats = [];
                 for (let k = 0; k < item.length; k++) {
                     lngs.push(parseFloat(item[k][0]));
                     lats.push(parseFloat(item[k][1]));
                 }
                 let result = false;
                 for (let i = 0; i < lngLats.length; i++) {
                     let lng = lngLats[i][0],
                         lat = lngLats[i][1];
                     result = isPolyContains(lats, lngs, lng, lat);
                     if (result) {
                         continue;
                     } else {
                         break;
                     }
                 }
                 if (result) return j;
             }
         }
         return -1;
     }

     /**
      * 右击事件
      * @param {*} event 
      */
     _rightclick(event) {
         if (this.isCreate || !this._opts.style.isDel || !this._opts.style.isEdit) return;
         let coordinates = this._workerData[0].geometry.coordinates;
         for (let j = 0, len = coordinates.length; j < len; j++) {

             let item = coordinates[j][0];

             let lngs = [],
                 lats = [];
             for (let k = 0; k < item.length; k++) {
                 lngs.push(parseFloat(item[k][0]));
                 lats.push(parseFloat(item[k][1]));
             }

             if (isPolyContains(lats, lngs, event.point.lng, event.point.lat)) {
                 coordinates.splice(j, 1);
                 this._workerData[0].geometry.pixels.splice(j, 1);
                 this._polygonOverlay.refresh();
                 this._eventConfig.onDelete.call(this, event);
                 break;
             }
         }

     }

     /**
      * 鼠标移动事件
      * @param {*} event 
      */
     _mousemoveFun(event) {

         if (!this.isCreate || !this._createTempCache) return;
         let data = this._polygonOverlay._workerData[0];
         let currentCoordinate = data.geometry.coordinates[this._createIndex];
         let currentPixels = data.geometry.pixels[this._createIndex];

         //外环
         currentCoordinate[0] = this._createTempCache.coordinates.concat([
             [event.point.lng, event.point.lat]
         ]);
         currentPixels[0] = this._createTempCache.pixels.concat([
             [event.offsetX, event.offsetY]
         ]);

         this._polygonOverlay._selectItem = [];
         this._polygonOverlay.refresh();
     }

     /**
      * 清空点标记事件
      */
     _clearPointOverlay() {
         if (!this._pointOverlay) return;
         this._pointOverlay._setWorkerData([]);
         this._pointOverlay.refresh();
         this._virtualPointOverlay._setWorkerData([]);
         this._virtualPointOverlay.refresh();
     }

     /**
      * 设置虚拟点数据集
      */
     _setVirtualPointData() {

         let virtualData = [];
         for (let i = 0; i < this._pointDataGroup.length; i++) {
             let data = this._pointDataGroup[i];
             if (data.length > 0) {
                 data = data.concat([data[0]]);
             }

             for (let j = 0, len = data.length; j < len; j++) {

                 if (j + 1 > data.length - 1) {
                     break;
                 }

                 let geometry = data[j].geometry,
                     nextGeometry = data[j + 1].geometry;
                 let item = {
                     geometry: {
                         type: 'Point',
                         coordinates: [(geometry.coordinates[0] + nextGeometry.coordinates[0]) / 2, (geometry.coordinates[1] + nextGeometry.coordinates[1]) / 2],
                         pixel: {
                             x: (geometry.pixel.x + nextGeometry.pixel.x) / 2,
                             y: (geometry.pixel.y + nextGeometry.pixel.y) / 2
                         },
                     },
                     pre: {
                         index: i,
                         i: j
                     },
                     next: {
                         index: i,
                         i: j < len - 2 ? j + 1 : 0
                     }
                 };
                 virtualData.push(item);

             }

         }
         if (!this._virtualPointOverlay) return;
         this._virtualPointOverlay._selectItem = [];
         this._virtualPointOverlay._setWorkerData(virtualData);
         this._virtualPointOverlay.refresh();
     }

     /**
      * 设置点数据集
      */
     _setPointData() {
         this._pointDataGroup = [];
         for (let i = 0; i < this._workerData.length; i++) {
             let item = this._workerData[i];
             let type = item.geometry.type;
             if (type == 'MultiPolygon') {
                 for (let k = 0; k < item.geometry.coordinates.length; k++) {
                     this._Andcoordinates(item.geometry.coordinates[k], item.geometry.pixels[k], this._pointDataGroup, i, k);
                 }

             }

         }
         let pointData = [];
         for (let i = 0; i < this._pointDataGroup.length; i++) {
             pointData = pointData.concat(this._pointDataGroup[i]);
         }
         if (!this._pointOverlay) return;
         this._pointOverlay._selectItem = [];
         this._pointOverlay._setWorkerData(pointData);
         this._pointOverlay.refresh();
     }

     /**
      * 坐标与坐标
      * @param {*} coordinates 
      * @param {*} pixels 
      * @param {*} target 
      * @param {*} Arrindex 
      * @param {*} coordinatesIndex 
      */
     _Andcoordinates(coordinates, pixels, target, Arrindex, coordinatesIndex) {

         for (let i = 0; i < coordinates.length; i++) {
             let points = coordinates[i];
             let arr = [];
             for (let j = 0; j < points.length; j++) {
                 let point = points[j];
                 let pixel = pixels[i][j];
                 arr.push({
                     geometry: {
                         type: 'Point',
                         coordinates: [point[0], point[1]],
                         pixel: {
                             x: pixel[0],
                             y: pixel[1]
                         }
                     },
                     _index: {
                         Arrindex,
                         coordinatesIndex,
                         surround: i,
                         i: j
                     }
                 });
             }
             target.push(arr);
         }
     }

     /**
      * 绘制结束虚拟点
      * @param {*} item 
      * @param {*} index 
      * @param {*} event 
      */
     _dragEndVirtual(item, index, event) {
         let key = this._pointOverlay._workerData[index]._index;
         this._draggingPointTemp = null;
         this._draggingVirtualTemp = null;
         this._updatePolygon(item, key, 'insert', event);
         this._clearCanvas();
     }

     /**
      * 绘制结束点
      * @param {*} item 
      * @param {*} index 
      * @param {*} event 
      */
     _dragEndPoint(item, index, event) {
         let key = this._pointOverlay._workerData[index]._index;
         this._draggingPointTemp = null;
         this._draggingVirtualTemp = null;
         this._clearCanvas();
         this._updatePolygon(item, key, 'update', event);
     }

     /**
      * 鼠标双击事件
      * @param {*} item 
      * @param {*} index 
      * @param {*} event 
      */
     _dblclickPoint(item, index, event) {
         let key = this._pointOverlay._workerData[index]._index;
         this._clearCanvas();
         this._updatePolygon(item, key, 'delete', event);
     }

     /**
      * 更新面数据
      * @param {*} item 
      * @param {*} key 
      * @param {*} action 
      * @param {*} event 
      */
     _updatePolygon(item, key, action, event) {

         let findGeometry = this._workerData[key.Arrindex].geometry;

         if (findGeometry.type == 'MultiPolygon') {
             let latLngs = findGeometry.coordinates[key.coordinatesIndex][key.surround];
             let pixels = findGeometry.pixels[key.coordinatesIndex][key.surround];
             switch (action) {
                 case 'insert':
                     latLngs.splice(key.i + 1, 0, item.geometry.coordinates);
                     pixels.splice(key.i + 1, 0, [item.geometry.pixel.x, item.geometry.pixel.y]);
                     break;
                 case 'update':
                     latLngs.splice(key.i, 1, item.geometry.coordinates);
                     pixels.splice(key.i, 1, [item.geometry.pixel.x, item.geometry.pixel.y]);
                     break;
                 case 'delete':
                     latLngs.splice(key.i, 1);
                     pixels.splice(key.i, 1);
                     break;
             }

             this._polygonOverlay.refresh();
             this._setPointData();
             this._setVirtualPointData();
             //触发 change 事件
             this._eventConfig.onChange.call(this, action, event);
         }
     }

     /**
      * 获取点数据集合
      * @param {*} data 
      * @param {*} item 
      */
     _findPointDataGroup(data, item) {
         for (let i = 0; i < data.length; i++) {
             let points = data[i];
             for (let index = 0; index < points.length; index++) {
                 if (item == points[index]) {
                     return {
                         i,
                         index,
                         points
                     };
                 }
             }
         }

         return {
             index: -1,
             points: null
         };
     }

     /**
      * 拖拽点标记
      * @param {*} item 
      */
     _draggingPoint(item) {

         if (!this._draggingPointTemp) {
             this._draggingPointTemp = this._findPointDataGroup(this._pointDataGroup, item);
         }

         let index = this._draggingPointTemp.index,
             virtualLine = [],
             data = this._draggingPointTemp.points,
             len = data.length;

         if (index == 0) {
             virtualLine.push(data[len - 1]);
         } else {
             virtualLine.push(data[index - 1]);
         }

         virtualLine.push(data[index]);

         if (index == len - 1) {
             virtualLine.push(data[0]);
         } else {
             virtualLine.push(data[index + 1]);
         }

         this._drawLine(virtualLine);
         this._setVirtualPointData();
     }

     /**
      * 拖拽虚拟点
      * @param {*} item 
      */
     _draggingVirtual(item) {
         let preItem = this._pointDataGroup[item.pre.index][item.pre.i];
         let nextItem = this._pointDataGroup[item.next.index][item.next.i];
         let virtualLine = [preItem, item, nextItem];
         this._drawLine(virtualLine);
     }

     /**
      * 绘制线路
      * @param {*} data 
      */
     _drawLine(data) {
         this._clearCanvas();
         this._ctx.beginPath();
         this._ctx.save();
         this._ctx.lineWidth = 4;
         this._ctx.strokeStyle = 'red';
         this._ctx.setLineDash([10, 5]);
         for (let i = 0; i < data.length; i++) {
             let geometry = data[i].geometry;
             if (i == 0) {
                 this._ctx.moveTo(geometry.pixel.x, geometry.pixel.y);
             } else {
                 this._ctx.lineTo(geometry.pixel.x, geometry.pixel.y);
             }
         }
         this._ctx.stroke();
         this._ctx.restore();
     }

 }