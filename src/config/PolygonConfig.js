/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.30
 * Version: 0.0.1
 * Description: 不规则图形、围栏参数结构
 */
 export default {
 	
 	// 图层的悬浮提示层配置
     tooltip: {
         show: false,	// 是否显示，默认值false
         formatter: '{count}',	// 用来格式化悬浮的Html，支持字符串模板和回调函数两种形式
         customClass: 'inmap-tooltip-black', //是否自定义样式,用户可以个性化设置class,系统默认black样式。
         offsets: {
             top: 5,
             left: 12,	//左偏移量 
         }

     },
     // 图例的配置
     legend: {
         show: false,	// 是否显示图例
         toFixed: 2, //保留两位小数
     },

	//  样式配置
     style: {
         isHighlight: false,
         //  默认状态的样式配置
         normal: {
             borderWidth: 0.1,	// 边框宽度
             backgroundColor: 'rgba(200, 200, 200, 0.5)',	// 背景颜色 RGB/HSL/HEX
             mergeCount: 1.5,
             // 采用了最佳标记算法策略：找出多边形最佳位置，如果围栏空间不足以放下文字内容，则选择隐藏
             label: {
                 enable: true,
                 show: false,	// 是否显示文字
                 color: 'rgba(0,0,0,1)',	// 字体颜色
                 font: '13px Arial'	// 文字的样式
             },
         },
		
		// 设置一组数组颜色（rgba），并开启智能配色模式。 注意：该配置也会自动生成图例内容
         colors: [

         ],
         
         //  跟数据集Count属性，设置不同区间范围的样式。该配置会自动生成图例内容
         splitList: [],

     },
     data: [],
     checkDataType: {
         name: true,
         count: true
     },
     event: {
         multiSelect: false, //是否支持多选
         onMouseClick() {},
         onState() {

         }
     }
 };