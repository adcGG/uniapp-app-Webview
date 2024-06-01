<template>
  <view>
    <web-view :src="webviewUrl" bindmessage=""></web-view>
  </view>
</template>

<script>
import { appSendMessage } from "../../utils/appToWebview";

export default {
  components: {},
  props: {},
  mounted() {
    setTimeout(() => {
      appSendMessage(this, "msgFromApp", { msgFromApp: 233 });
    }, 5000);
  },
  data() {
    return {
      webviewUrl: "http://192.168.1.16:8080/#/pages/h5/index",
    };
  },
};
</script>

<style lang="scss"></style>
