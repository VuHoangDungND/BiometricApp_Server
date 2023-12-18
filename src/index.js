const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const route = require('./routes');
const http = require('http');
const faceapi = require('face-api.js');


app.use(cors());
app.use(
    express.urlencoded({
        extended: true,
    }),
);
app.use(express.json());

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromDisk('./models'),
    faceapi.nets.faceLandmark68Net.loadFromDisk('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromDisk('./models')
]).then(()=> console.log("done!"))

route(app);

const httpServer = http.createServer(app);

httpServer.listen(port, () => console.log(`listening on port ${port}`));
