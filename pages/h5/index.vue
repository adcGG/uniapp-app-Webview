<template>
  <view>
    <view>
      <image
        id="pic"
        :style="{
          width: '100%',
        }"
        src="/static/mirage.png"
        mode="widthFix"
        lazy-load="false"
        binderror=""
        bindload=""
      >
      </image>
    </view>
    <view class="center">
      <view class="btn" @click="imgToBase64"> 保存图片 </view>
    </view>
  </view>
</template>

<script>
import { getImage } from "../../utils/img";
export default {
  components: {},
  props: {},
  data() {
    return {};
  },
  mounted() {},
  methods: {
    imgToBase64() {
      const imgPicEl = document
        .getElementById("pic")
        ?.getElementsByTagName("img")[0];
      console.dir(imgPicEl);
      const imgBase64 = getImage(imgPicEl);
      const downloadName = new Date().getTime() + ".png";
      this.$uWeb.postMessage({
        data: {
          action: "appSaveImgFile",
          params: {
            base64: imgBase64,
            downloadName,
          },
        },
      });
    },
  },
};
</script>

<style lang="scss">
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn {
  padding: 10px 16px;
  background-color: aquamarine;
  border-radius: 99px;
  cursor: pointer;
}
</style>
