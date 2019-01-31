/**
 * Copyright(C),2019-2029,www.jszcrj.com
 * Author: org_hejianhui@163.com
 * Date: 2019.01.31
 * Version: 0.0.1
 * Description: 点拖拽绘制配置类
 */
 export default {
    tooltip: {
        show: false,
    },
    legend: {
        show: false,
    },
    style: {
        normal: {
            size: 3,
            borderWidth: 0.1,
            backgroundColor: 'rgba(200, 200, 200, 0.5)',
       
        },
        splitList:[]
    },
    data: [],
    checkDataType: {
        name: false,
        count: false
    },
    event: {
         onDragStart:function(){},
         onDragging:function(){},
         onDragEnd:function(){
         },
         onDblclick:function(){

         }
    }
};