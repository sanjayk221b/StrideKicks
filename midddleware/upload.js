const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, "..", "public", "images"));
    },
    filename: (req, file, callback) => {
        const imageName = Date.now() + '-' + file.originalname;
        callback(null, imageName);
    }
});

const imageFilter = (req, file, next) => {
    const allowedImageFormats = /\.(jpg|jpeg|png|gif|webp)$/;

    if (!file.originalname.match(allowedImageFormats)) {
        req.fileValidationError = "Only image files (jpg, jpeg, png, gif, webp) are allowed..!!";
        return next(new Error("Only image files are allowed..!!"), false);
    }

    next(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: imageFilter
}).array('images');

module.exports = {
    upload
};
