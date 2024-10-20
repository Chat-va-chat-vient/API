const sharp = require("sharp");

exports.convertImageToPng = (inputPath, outputPath) => {
  return sharp(inputPath).png().toFile(outputPath);
};
