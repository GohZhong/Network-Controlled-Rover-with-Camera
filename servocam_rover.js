const express = require('express');
const http = require('http');
const fs = require('fs')
const { Server } = require('socket.io');
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline');
const cv = require('opencv4nodejs');

// Open Arduino serial port

const portName = '/dev/ttyACM0';  //Arduino serial port location 
let sp;
try {
    sp = new SerialPort(portName, {
       baudRate: 9600,
       dataBits: 8,
       parity: 'none',
       stopBits: 1,
       flowControl: false
    });
} catch (err) {
    console.log('Error: ', err.message);
}

// Read the port data
sp.on("open", () => {
    console.log('Serial port open');
});

//Parse Arduino messages
const parser = sp.pipe(new Readline({ delimiter: '\n' }));
parser.on('data', data =>{
    console.log('Arduino says: ', data);
});

//Server Code
const app = express()
const server = http.createServer(app);
const io = new Server(server)

const onlineClients = new Set();

//Webcam OPENCV setup
const FPS=24;
let wCap = null;


//Websockets Code 
function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has connected.`);
    onlineClients.add(socket.id);
    try {
        wCap = new cv.VideoCapture(0);
        wCap.set(cv.CAP_PROP_FRAME_WIDTH, 5000);
    } catch (err) {
        console.log(err);
    }
    
    const stream = setInterval(() => {
        if(wCap){
            const frame = wCap.read();
            const rotated = frame.rotate(cv.ROTATE_180);  //Rotate image by 180 due to camera mount orientation
            // const frameWithFaces = faceDetector(rotated);
            // const imageWithFaces = cv.imencode('.jpg', frameWithFaces);
            const image = cv.imencode('.jpg', rotated);
            io.emit('new-frame', image);
            // io.emit('new-frame', imageWithFaces); 
        }
    },1000/FPS);

    socket.on("move",(dir)=>{
        switch (dir) {
            case 0:
                sp.write("w\n");
                // console.log("Move forward");
                break;
            case 1:
                sp.write("s\n");
                // console.log("Move reverse");
                break;
            case 2:
                sp.write("a\n");
                // console.log("Move left");
                break;
            case 3:
                sp.write("d\n");
                // console.log("Move right");
                break;
            case 4:
                sp.write("c\n");
                // console.log("Stopped moving");
                break;
            default:
                break;
        }
    })

    socket.on("pan_tilt",(dir)=>{
        switch (dir) {
            case 0:
                sp.write("u\n");
                // console.log("Move forward");
                break;
            case 1:
                sp.write("b\n");
                // console.log("Move reverse");
                break;
            case 2:
                sp.write("l\n");
                // console.log("Move left");
                break;
            case 3:
                sp.write("r\n");
                // console.log("Move right");
                break;
            default:
                break;
        }
    })

    socket.on("disconnect", () => {
        clearInterval(stream);
        wCap.release();
        onlineClients.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
        socket.removeAllListeners();
    });
}

app.get('/', function (req, res) {
    fs.readFile(__dirname + '/public/servo_cam.html',(err)=> { 
        if (err){
            res.status(404).json('Error 404: File Not Found');
        }
        res.sendFile(__dirname + '/public/servo_cam.html');
    });
});

io.on('connection', onNewWebsocketConnection);

process.on('SIGINT',()=>{
    server.close(() => {
        console.log('Closed out remaining connections');
    });
    process.exit(0)
})

server.listen(3000, ()=>{
    console.log("Server is running")
})

