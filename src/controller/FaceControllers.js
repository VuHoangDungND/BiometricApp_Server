const faceapi = require('face-api.js');
const fs = require('fs');
const canvas = require("canvas");
const path = require('path');
const db = require('../config/db');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    //xóa dữ liệu folder public
    function clearCache() {
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

    //viết thêm dữ liệu mới vào Jsonfile
    function writeToJSONFile(filePath, data,res) {
      // Chuyển đối tượng JavaScript thành chuỗi JSON
      const jsonDataString = JSON.stringify(data, null, 2);

      // Ghi dữ liệu mới vào tệp JSON
      fs.writeFile(filePath, jsonDataString, 'utf8', (err) => {
        if (err) {
          res.status(200).json({message: `lỗi thêm dữ liệu: ${err}`}); 
        } else {
          res.status(200).json({message: "đăng ký dữ liệu thành công"});
        }
      });
    }

    //xóa dữ liệu file Jsonfile
    function deleteJSONFile(filePath,res) {
      // Tạo một tệp JSON trống
      const emptyData = [];

      // Chuyển đối tượng JavaScript thành chuỗi JSON
      const emptyJsonString = JSON.stringify(emptyData, null, 2);

      //ghi đè dữ liệu trống
      fs.writeFile(filePath, emptyJsonString,'utf8', (err) => {
        if (err) {
          res.status(200).json({message: `lỗi xóa dữ liệu: ${err}`}); 
        } else {
          res.status(200).json({message: "xóa dữ liệu thành công"}); 

        }
      })
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

      
      // // Đường dẫn đến tệp JSON
      // const jsonFilePath = 'store/labeledFacesData.json';

      // //Đọc dữ liệu lưu trữ tạm thời
      // fs.readFile(jsonFilePath, 'utf8', (err, data) => {
      //     if (err) {
      //       res.status(200).json({message: `lỗi đọc dữ liệu: ${err}`}); 
      //       return;
      //     }
        
      //     try {
      //       // Parse dữ liệu từ chuỗi JSON thành đối tượng JavaScript
      //       const jsonData = data?JSON.parse(data):[];
           
      //       const jsonDataAfter = [...jsonData,{ label: labelFaceDescriptor.label, descriptors: labelFaceDescriptor.descriptors} ];
      //       clearCache();
        
      //       // Ghi lại dữ liệu mới và giữ nguyên dữ liệu cũ vào tệp JSON
      //       writeToJSONFile(jsonFilePath, jsonDataAfter,res);
      //     } catch (parseError) {
      //       res.status(200).json({message: `lỗi đọc dữ liệu: ${err}`}); 
      //     }
      //   }); 

      const myDescriptors = Array.from(labelFaceDescriptor.descriptors);

      let query = "INSERT INTO `biometric` ( `label`, `descriptors`) VALUES ( '" +
                  labelFaceDescriptor.label +
                  "' ,'" +
                  JSON.stringify(myDescriptors, null, 2) +
                  "')";
                  
      db.query(query, function (err, result) {
        if (err) return res.status(400);
        res.status(200).json({ message: "Thành công thêm dữ liệu" });
      });
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

      // Đường dẫn đến tệp JSON
      const jsonFilePath = 'store/labeledFacesData.json';

      //Đọc dữ liệu lưu trữ tạm thời
      fs.readFile(jsonFilePath, 'utf8', async(err, data) => {
          if (err) {
            res.status(200).json({message: `lỗi đọc dữ liệu: ${err}`}); 
            return;
          }
        
          try {
              // Parse dữ liệu từ chuỗi JSON thành đối tượng JavaScript
              const jsonData = data?JSON.parse(data):[];
              
              // Chuyển đổi JSON thành mảng LabeledFaceDescriptors
              const labeledFaceDescriptorsArray = await jsonData.map(item => {
                const label = item.label;
                const descriptors = item.descriptors.map(descriptor => {
                  const tmp = [];
                  for(let i = 0; i <128; i++ ) {
                    tmp.push(descriptor[i]);
                  };
                  return new Float32Array(tmp);
                });
                return new faceapi.LabeledFaceDescriptors(label, descriptors);
              }); 
  
              const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptorsArray, 0.7);
  
              const result = faceMatcher.findBestMatch(detection.descriptor);
              res.status(200).json({label: `${result.label}`})
        
              clearCache();
          } catch (parseError) {
            res.status(200).json({message: `lỗi đọc dữ liệu: ${err}`}); 
          }
        });

    }


class FaceControllers{
    
    
    //[POST] /checkFace
    async checkFace(req, res, next) {
      const file = req.file;
      console.log('file check Face :',file);
      findFace(file,res);        
    }

    //[GET] /delete
    delete(req, res, next) {
      // Đường dẫn đến tệp JSON
      const jsonFilePath = 'store/labeledFacesData.json';
      clearCache();
      deleteJSONFile(jsonFilePath,res);
    }

    //[POST] /
    register(req, res, next) {
        const file = req.file;
        const info = JSON.parse(JSON.parse(JSON.stringify(req.body)).info);
        console.log('file register Face :',file);
        saveData(file,info,res);

    }

}

module.exports = new FaceControllers();