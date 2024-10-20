const multer = require("multer");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format de fichier non supporté. Veuillez télécharger un fichier JPEG ou PNG."
        )
      );
    }
  },
});

module.exports = upload;
