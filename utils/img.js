
function getImage(image) {
  let canvas = document.createElement("canvas");
  console.log('image.width', image.width);
  canvas.width = image.width;
  canvas.height = image.height;
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height);
  // 这里的dataurl就是base64类型
  let dataURL = canvas.toDataURL("image/png");
  return dataURL;
}

export {
  getImage
}