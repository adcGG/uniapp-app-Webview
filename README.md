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

2. 在App.vue中注册事件；将 appMessageHandle.js 里面所有导出的事件进行注册；**注意需要条件编译**
   
   ```js
   // App.vue
   <script>
   import * as appPlusMessageHandler from "./utils/appMessageHandler";
   
   export default {
     data() {
       return {
         appRegisterMap: undefined,
       };
     },
     onLaunch: function () {
       console.log("App Launch");
       // #ifdef APP-PLUS
       // 注册事件
       plus.globalEvent.addEventListener("plusMessage", this.plusMessageHandler);
       // #endif
     },
     methods: {
       /**
        * 将所有导出的 app 事件
        * 用 map 建立 函数名 - 函数 的联系
        * 返回 map
        */
       registerAppPlusMap() {
         if (this.appRegisterMap) {
           return this.appRegisterMap;
         }
         let map = new Map();
         Object.keys(appPlusMessageHandler).forEach((item) => {
           map.set(item, appPlusMessageHandler[item]);
         });
         this.appRegisterMap = map;
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
   ```

### webview 部分

通过使用 uni.webview.js (文末附录放源码，我做了些许修改，逻辑没改，是一些变量调整了下) 的功能 postMessage , 向 app 发送图片生成的 base64；

1. main.js 中挂载 uWeb (uni.webview.js)
   
   ```js
   // main.js
   // 全局添加uWeb
   // #ifdef H5
   import uWeb from "@/utils/uni.webview.js";
   // #endif
   
   // #ifdef H5
   Vue.prototype.$uWeb = uWeb;
   // #endif
   ```

2. 生成的图片base64，通过以下方式发送给 app
   
   **此处 action 与 上面 plusMessageHandler方法的 action 是对应的**
   
   **appSaveImgFile 与 appMessageHandler.js 里的函数名是对应的**
   
   ```js
   // 某个页面或者js
   this.$uWeb.postMessage({
           data: {
             action: "appSaveImgFile",
             params: {
               base64: imgBase64,
               downloadName,
             },
           },
         });
   ```

至此，webview 能随时向 app 发送消息了

<img src="./md/20240601160919.png" title="" alt="" width="334">

## App 向 webview 发送消息

使用 **evalJS**

分两步：

1. webview 在 window 注册事件

2. app 使用 evalJs 触发 webview 的事件

**注意： 确保webview 先注册好事件之后，app发送的事件才能被 webview 接收到**

具体实现，utils下新建appToWebview.js;  appSendMessage 是给 App 用的；webviewGetMessage 是给 webview 注册用的

```js
// appToWebview.js
// 发送信息之前，先要有 webviewGetMessage
function appSendMessage(_this, action, params) {
  const self = _this;
  self.currentWebview = self.$scope?.$getAppWebview()?.children()[0];
  //传递大量数据
  self.currentWebview?.evalJS(`${action}(${JSON.stringify(params)})`);
}

function webviewGetMessage(action, callback) {
  // #ifdef H5
  window[action] = (data) => {
    let params = JSON.parse(JSON.stringify(data));
    callback(params);
  };
  // #endif
}

export { appSendMessage, webviewGetMessage };
```

### webview 部分

用 webviewGetMessage 注册一个 msgFromApp 名字的事件，给 App 调用；

```js
  // 某个 webview 页面，
  created() {
    webviewGetMessage("msgFromApp", (params) => {
      console.log("getAppParams", params);
      this.appMsg = params;
    });
  },
```

### App

用 appSendMessage 发送一个信息给 webview

```js
  // 某个有 webview 的 app 页面，
  mounted() {
    setTimeout(() => {
      appSendMessage(this, "msgFromApp", { msgFromApp: 233 });
    }, 5000);
  },
```

<img title="" src="./md/appToWebview.png" alt="" width="334">

至此，完成了 app 向 webview 发送信息

## GitHub 地址

[GitHub - adcGG/uniapp-app-webview: Communication between app and webview](https://github.com/adcGG/uniapp-app-webview)

这里 uniapp 项目，app 和 用到的 h5 地址是同一个项目下的

app/index 用到的 webview 的 url 为 webviewUrl: "<http://192.168.1.16:8080/#/pages/h5/index>",

<img title="" src="./md/webview_url.png" alt="">

## 附录

### uni.webview.js

```js
!(function (e, n) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = n())
    : "function" == typeof define && define.amd
    ? define(n)
    : ((e = e || self).webUni = n());
})(this, function () {
  "use strict";
  try {
    var e = {};
    Object.defineProperty(e, "passive", {
      get: function () {
        !0;
      },
    }),
      window.addEventListener("test-passive", null, e);
  } catch (e) {}
  var n = Object.prototype.hasOwnProperty;

  function t(e, t) {
    return n.call(e, t);
  }
  var i = [],
    a = function (e, n) {
      var t = {
        options: {
          timestamp: +new Date(),
        },
        name: e,
        arg: n,
      };
      if (window.__dcloud_weex_postMessage || window.__dcloud_weex_) {
        if ("postMessage" === e) {
          var a = {
            data: [n],
          };
          return window.__dcloud_weex_postMessage
            ? window.__dcloud_weex_postMessage(a)
            : window.__dcloud_weex_.postMessage(JSON.stringify(a));
        }
        var o = {
          type: "WEB_INVOKE_APPSERVICE",
          args: {
            data: t,
            webviewIds: i,
          },
        };
        window.__dcloud_weex_postMessage
          ? window.__dcloud_weex_postMessageToService(o)
          : window.__dcloud_weex_.postMessageToService(JSON.stringify(o));
      }
      if (!window.plus)
        return window.parent.postMessage(
          {
            type: "WEB_INVOKE_APPSERVICE",
            data: t,
            pageId: "",
          },
          "*"
        );
      if (0 === i.length) {
        var r = plus.webview.currentWebview();
        if (!r) throw new Error("plus.webview.currentWebview() is undefined");
        var d = r.parent(),
          s = "";
        (s = d ? d.id : r.id), i.push(s);
      }
      if (plus.webview.getWebviewById("__uniapp__service"))
        plus.webview.postMessageToUniNView(
          {
            type: "WEB_INVOKE_APPSERVICE",
            args: {
              data: t,
              webviewIds: i,
            },
          },
          "__uniapp__service"
        );
      else {
        var w = JSON.stringify(t);
        plus.webview
          .getLaunchWebview()
          .evalJS(
            'UniPlusBridge.subscribeHandler("'
              .concat("WEB_INVOKE_APPSERVICE", '",')
              .concat(w, ",")
              .concat(JSON.stringify(i), ");")
          );
      }
    },
    o = {
      navigateTo: function () {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          n = e.url;
        a("navigateTo", {
          url: encodeURI(n),
        });
      },
      navigateBack: function () {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          n = e.delta;
        a("navigateBack", {
          delta: parseInt(n) || 1,
        });
      },
      switchTab: function () {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          n = e.url;
        a("switchTab", {
          url: encodeURI(n),
        });
      },
      reLaunch: function () {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          n = e.url;
        a("reLaunch", {
          url: encodeURI(n),
        });
      },
      redirectTo: function () {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          n = e.url;
        a("redirectTo", {
          url: encodeURI(n),
        });
      },
      getEnv: function (e) {
        window.plus
          ? e({
              plus: !0,
            })
          : e({
              h5: !0,
            });
      },
      postMessage: function () {
        var e =
          arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        a("postMessage", e.data || {});
      },
    },
    r = /uni-app/i.test(navigator.userAgent),
    d = /Html5Plus/i.test(navigator.userAgent),
    s = /complete|loaded|interactive/;
  var w = window.my && navigator.userAgent.indexOf("AlipayClient") > -1;
  var u =
    window.swan && window.swan.webView && /swan/i.test(navigator.userAgent);
  var c =
    window.qq &&
    window.qq.miniProgram &&
    /QQ/i.test(navigator.userAgent) &&
    /miniProgram/i.test(navigator.userAgent);
  var g =
    window.tt &&
    window.tt.miniProgram &&
    /toutiaomicroapp/i.test(navigator.userAgent);
  var v =
    window.wx &&
    window.wx.miniProgram &&
    /micromessenger/i.test(navigator.userAgent) &&
    /miniProgram/i.test(navigator.userAgent);
  var p = window.qa && /quickapp/i.test(navigator.userAgent);
  for (
    var l,
      _ = function () {
        (window.UniAppJSBridge = !0),
          document.dispatchEvent(
            new CustomEvent("UniAppJSBridgeReady", {
              bubbles: !0,
              cancelable: !0,
            })
          );
      },
      f = [
        function (e) {
          if (r || d)
            return (
              window.__dcloud_weex_postMessage || window.__dcloud_weex_
                ? document.addEventListener("DOMContentLoaded", e)
                : window.plus && s.test(document.readyState)
                ? setTimeout(e, 0)
                : document.addEventListener("plusready", e),
              o
            );
        },
        function (e) {
          if (v)
            return (
              window.WeixinJSBridge && window.WeixinJSBridge.invoke
                ? setTimeout(e, 0)
                : document.addEventListener("WeixinJSBridgeReady", e),
              window.wx.miniProgram
            );
        },
        function (e) {
          if (c)
            return (
              window.QQJSBridge && window.QQJSBridge.invoke
                ? setTimeout(e, 0)
                : document.addEventListener("QQJSBridgeReady", e),
              window.qq.miniProgram
            );
        },
        function (e) {
          if (w) {
            document.addEventListener("DOMContentLoaded", e);
            var n = window.my;
            return {
              navigateTo: n.navigateTo,
              navigateBack: n.navigateBack,
              switchTab: n.switchTab,
              reLaunch: n.reLaunch,
              redirectTo: n.redirectTo,
              postMessage: n.postMessage,
              getEnv: n.getEnv,
            };
          }
        },
        function (e) {
          if (u)
            return (
              document.addEventListener("DOMContentLoaded", e),
              window.swan.webView
            );
        },
        function (e) {
          if (g)
            return (
              document.addEventListener("DOMContentLoaded", e),
              window.tt.miniProgram
            );
        },
        function (e) {
          if (p) {
            window.QaJSBridge && window.QaJSBridge.invoke
              ? setTimeout(e, 0)
              : document.addEventListener("QaJSBridgeReady", e);
            var n = window.qa;
            return {
              navigateTo: n.navigateTo,
              navigateBack: n.navigateBack,
              switchTab: n.switchTab,
              reLaunch: n.reLaunch,
              redirectTo: n.redirectTo,
              postMessage: n.postMessage,
              getEnv: n.getEnv,
            };
          }
        },
        function (e) {
          return document.addEventListener("DOMContentLoaded", e), o;
        },
      ],
      m = 0;
    m < f.length && !(l = f[m](_));
    m++
  );
  l || (l = {});
  var E = "undefined" != typeof webUni ? webUni : {};
  if (!E.navigateTo) for (var b in l) t(l, b) && (E[b] = l[b]);
  return (E.webView = l), E;
});
```
