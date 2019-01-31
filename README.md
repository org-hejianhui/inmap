## 介绍
zcmap 是一款基于百度地图的大数据可视化库，专注于大数据方向的散点、热力图、网格、聚合等方式展示，致力于让大数据可视化变得简单易用。

## Features
- 高性能.
- 多线程.
- 多图层叠加.
- 支持GeoJSON
- 友好的 API.
- 可以自定义主题.

## 文档


## 示例效果图

## 首先引用地图
```html
<script type="text/javascript" src="http://api.map.baidu.com/api?v=3.0&ak=0lPULNZ5PmrFVg76kFuRjezF"></script>
```
## 安装
Using npm:
```
npm install zcmap --save
```

或使用 <script> 全局引用，zcmap 会被注册为一个全局变量:
```html
<script type="text/javascript" src="http://unpkg.com/zcmap/dist/zcmap.min.js"></script>
```

## 示例
```html
<script>
var map = new zcmap.Map({
    id: 'allmap',  
    skin: 'Blueness',
    center: [105.403119, 38.028658], // center of map
    zoom: {
        value: 5, // level of map
        show: true, // whether to display the zoom button
        max: 18, 
        min: 5
    }
})
</script>
```
## 预览当前项目所有demo
```shell
# 从 GitHub 下载后，安装依赖
npm install

# 编译代码
npm run dev

在浏览器地址栏输入：http://localhost:8088/examples/index.html
```
## 工程目录
zcmap
    |---assets  静态文件
    |---dist    打包文件
    |---examples    示例
    |---node_modules    依赖包
    |---src 工程资源
        |---common  公用类和一些其他的公共api/变量
            |---Color.js 颜色工具类
        |---config  默认的公用配置
        |---lib 第三方工具
        |---map 地图对象以及地图工具对象
            |---style   样式
            |---index   地图实例对象
            |---Legend  地图图例实例对象
            |---mapZoom 地图缩放实例对象
            |---Toolbar 地图工具实例对象
            |---ToolTip 地图提示实例对象
        |---overlay 地图各个实例对象
            |--- base 基础类
            |--- PolygonEditorOverlay 围栏编辑
            |--- GriddingOverlay 网格聚合
            |--- HeatOverlay 热力图
            |--- HoneycombOverlay 蜂窝聚合
            |--- ImgOverlay 矢量图
            |--- LabelOverlay 文字
            |--- LineStringAnimationOverlay 线路动画
            |--- LineStringOverlay 线路
            |--- MaskOverlay 围栏遮罩
            |--- MoveLineOverlay 飞线图 
            |--- PointAnimationOverlay 圆点动画
            |--- PointOverlay 散点
            |--- PolygonOverlay 围栏
        |---worker  大量for循环的方法-使用多线程处理
        |---main.js 主入口文件
        |---test    测试/单元测试
