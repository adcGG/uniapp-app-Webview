// 这里代码都在app下执行
function appSaveImgFile(params) {
  const { base64, downloadName } = params;
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

export { appSaveImgFile };
