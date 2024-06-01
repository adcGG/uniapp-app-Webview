<template>
  <view>
    <web-view :src="webviewUrl" bindmessage=""></web-view>
  </view>
</template>

<script>
export default {
  components: {},
  props: {},
  data() {
    return {
      webviewUrl: "http://192.168.1.16:8080/#/pages/h5/index",
    };
  },
};
</script>

<style lang="scss"></style>
