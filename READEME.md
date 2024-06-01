# 【Uniapp】App与webview双向实时通信

在 Uniapp 中，App 与 里面嵌入的 webview 进行双向的实时通信

vue2 ， 模拟器

主要分为两部分

+ webview 向 app 发送信息

+ app 向 webview 发送信息

以下是实现方式，用一个例子来说明

（文章最后我会放这个例子的github地址）



## webview 向 app 发送信息

**示例： webview 里面向 app 发送 图片的 base64 ， app 保存图片到系统相册；**

此处分为， app 和 webview 部分：

+ app 注册事件

+ webview 触发 app 的事件

### app部分

1. 保存到系统相册功能（功能具体细节不重要）
   
   ```javascript
   // utils/appMessageHandler.js
   // 这里代码都在app下执行
   function appSaveImgFile(params) {
     const { base64, downloadName } = params
     const bitmap = new plus.nativeObj.Bitmap("test");
     bitmap.loadBase64Data(
       base64,
       function () {
         const url = "_doc/" + downloadName + ".png"; // url为时间戳命名方式
         bitmap.save(
           url,
           {
             overwrite: true, // 是否覆盖
             // quality: 'quality'  // 图片清晰度
           },
           (i) => {
             plus.gallery.save(
               i.target,
               function () {
                 uni.showToast({
                   title: "APP图片保存至相册",
                   icon: "none",
                 });
                 bitmap.clear();
               },
               function (e) {
                 uni.showToast({
                   title: "APP图片保存至相册失败:" + JSON.stringify(e),
                   icon: "none",
                 });
                 bitmap.clear();
               }
             );
           },
           (e) => {
             uni.showToast({
               title: "图片保存失败1:" + JSON.stringify(e),
               icon: "none",
             });
             bitmap.clear();
           }
         );
       },
       (e) => {
         uni.showToast({
           title: "图片保存失败2:" + JSON.stringify(e),
           icon: "none",
         });
         bitmap.clear();
       }
     );
   }
   
   export {
     appSaveImgFile,
   }
   ```

2. 在App.vue中注册事件；将 appMessageHandle.js 里面所有事件统一进行注册
   
   ```js
   <script>
   import * as appPlusMessageHandler from "./utils/appMessageHandler";
   
   export default {
     onLaunch: function () {
       console.log("App Launch");
       // #ifdef APP-PLUS
       // 注册事件
       plus.globalEvent.addEventListener("plusMessage", this.plusMessageHandler);
       // #endif
     },
     onShow: function () {
       console.log("App Show");
     },
     onHide: function () {
       console.log("App Hide");
     },
     methods: {
       /**
        * 将所有导出的 app 事件
        * 用 map 建立 函数名 - 函数 的联系
        * 返回 map
        */
       registerAppPlusMap() {
         let map = new Map();
         Object.keys(appPlusMessageHandler).forEach((item) => {
           map.set(item, appPlusMessageHandler[item]);
         });
         return map;
       },
       /**
        * 用 action 获取的函数名
        * 通过 map 获取到函数，调用执行
        */
       plusMessageHandler(msg) {
         let map = this.registerAppPlusMap();
         if (msg.data.args.data.arg?.action) {
           let handler = map.get(msg.data.args.data.arg?.action);
           let params = msg.data.args.data.arg?.params;
           handler && handler(params);
         }
       },
     },
   };
   </script>
   
   <style>
   /*每个页面公共css */
   </style>
   
   ```
