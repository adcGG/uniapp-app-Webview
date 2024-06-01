
function getImage(image) {
  let canvas = document.createElement("canvas");
  console.log('image.width', image.width);
  canvas.width = image.width;
  canvas.height = image.height;
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height);
  let quality = 0.8;
  // 这里的dataurl就是base64类型
  let dataURL = canvas.toDataURL("image/png", quality);
  return dataURL;
}

export {
  getImage
}