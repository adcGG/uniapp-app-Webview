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

<style>
/*每个页面公共css */
</style>
