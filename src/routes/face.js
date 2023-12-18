const express = require('express')
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/' });

const FaceControllers = require('../controller/FaceControllers');

router.post('/checkFace',upload.single('file'), FaceControllers.checkFace);
router.get('/delete', FaceControllers.delete);
router.post('/',upload.single('file'), FaceControllers.register);

module.exports = router;

