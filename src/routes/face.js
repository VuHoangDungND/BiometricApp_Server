const express = require('express')
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/' });

const FaceControllers = require('../controller/FaceControllers');

router.post('/checkFace',upload.single('file'), FaceControllers.checkFace);
router.post('/delete', FaceControllers.delete);
router.post('/register',upload.array('file',3), FaceControllers.register);

router.get('/', FaceControllers.showData);

module.exports = router;

