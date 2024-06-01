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
