const faceapi = require('face-api.js');
const fs = require('fs');
const canvas = require("canvas");
const path = require('path');
const handleDatabase = require('../config/db');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    //xóa dữ liệu folder public
    const clearCache = () =>{
      // Đường dẫn đến duwx
      const dataFilePath = 'public';
      // Đọc danh sách tệp tin trong thư mục
      fs.readdir(dataFilePath, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return;
        }

        // Lặp qua từng tệp tin và xóa chúng
        files.forEach((file) => {
          const filePath = path.join(dataFilePath, file);

          // Xóa tệp tin
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting file ${file}:`, unlinkErr);
            } else {
              console.log(`File ${file} deleted successfully.`);
            }
          });
        });
      });
    }

    // lưu dữ liệu khuôn mặt đăng ký
    const saveData = async (data,info,res) => {
      //chuyển từ file thànnh buffer
      const imageBuffer = fs.readFileSync(data.path);

      //từ buffer về canvasImage
      const image = await canvas.loadImage(imageBuffer);
     
      //Landmark từng khuôn mặt
      const detection = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();

      //Lưu dữ liệu vào biến và đánh dấu từng nhãn dán
      const labelFaceDescriptor = new faceapi.LabeledFaceDescriptors(info,[detection.descriptor]);

      const myDescriptors = Array.from(labelFaceDescriptor.descriptors);

      let query = "INSERT INTO `biometric` ( `label`, `descriptors`) VALUES ( '" +
                  labelFaceDescriptor.label +
                  "' ,'" +
                  JSON.stringify(myDescriptors, null, 2) +
                  "')";

      //xóa file public
      clearCache();
      const callback = (db) => {
        db.query(query, function (err, result) {
          if (err) return res.status(400);
          res.status(200).json({ message: "Thành công thêm dữ liệu" });
        });
      }
      handleDatabase(callback);
    }

    //nhận diện khuôn mặt so với lưu trữ
    const findFace = async(data,res) => {

      //chuyển từ file thànnh buffer
      const imageBuffer = fs.readFileSync(data.path);

      //từ buffer về canvasImage
      const image = await canvas.loadImage(imageBuffer);
     
      //Landmark từng khuôn mặt
      const detection = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();

      let query = "SELECT * FROM `biometric`";

      //xóa dữ liệu tạm thời
      clearCache();

      const callback = (db) => {
        db.query(query, function (err, result) {
          if (err) return res.status(400);
          const array = [];
          result.forEach((item) => {
            const arrayItem = Object.values(item);
            const label = arrayItem[0];
            const arrayDescriptors = JSON.parse(arrayItem[1]);
            const descriptors =  arrayDescriptors.map(descriptor => {
              const tmp = [];
              for(let i = 0; i <128; i++ ) {
                tmp.push(descriptor[i]);
              };
                return new Float32Array(tmp);
            });
  
            array.push(new faceapi.LabeledFaceDescriptors(label, descriptors))
          })
  
          //Tìm khuôn mặt khớp
          const faceMatcher = new faceapi.FaceMatcher(array, 0.7);
          const findedFace = faceMatcher.findBestMatch(detection.descriptor);
  
          res.status(200).json({label: `${findedFace.label}`})
        });
      }
      handleDatabase(callback);
    }


class FaceControllers{
    
    
    //[POST] /checkFace
    checkFace(req, res, next) {
      const file = req.file;
      console.log('file check Face :',file);
      findFace(file,res);        
    }

    //[POST] /delete
    delete(req, res, next) {

      clearCache();

      //Kiểm tra mật mã
      if(req.body.pass === process.env.PASS) {
        const query = "DELETE  FROM `biometric`";
        const callback = (db) => {
          db.query(query, function (err, result) {
            if (err) return res.status(400);
            res.status(200).json({ message: "Xóa dữ liệu thành công" });
          })   
        }
        handleDatabase(callback);
      } else {
        res.status(200).json({ message: "Sai mật mã. Mời nhập lại" });
      }

      
    }

    //[POST] /register
    register(req, res, next) {
        const file = req.file;
        const info = JSON.parse(JSON.parse(JSON.stringify(req.body)).info);
        console.log('file register Face :',file);
        saveData(file,info,res);
    }

    //[GET] /
    showData(req, res, next) {
      const query = "SELECT label FROM `biometric`";
      const callback = (db) =>{
        db.query(query, function (err, result) {
          if (err) return res.status(400);
          const array = [];
          result.forEach((item) => {
            const arrayItem = Object.values(item);
            array.push(...arrayItem);
          })
          res.status(200).json({list: array});
        })
      }
      handleDatabase(callback); 
    }
}

module.exports = new FaceControllers();