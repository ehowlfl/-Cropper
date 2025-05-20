const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Express 앱 설정
const app = express();
app.use(cors());
const server = http.createServer(app);

// Socket.io 설정
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 시리얼 포트 설정 (COM 포트는 사용자 환경에 맞게 변경 필요)
let serialPort;
let parser;
let connectedPort = null;

// 사용 가능한 포트 목록 가져오기
async function listPorts() {
  const ports = await SerialPort.list();
  return ports;
}

// 시리얼 포트 연결
function connectToPort(portName) {
  try {
    serialPort = new SerialPort({ 
      path: portName, 
      baudRate: 9600,
      autoOpen: false
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // 데이터 수신 이벤트
    parser.on('data', (data) => {
      console.log('수신된 데이터:', data);
      io.emit('serialData', data);
    });

    // 포트 열기
    serialPort.open((err) => {
      if (err) {
        console.error('포트 열기 실패:', err.message);
        io.emit('serialError', err.message);
        return;
      }
      console.log(`${portName}에 연결됨`);
      connectedPort = portName;
      io.emit('serialConnected', portName);
    });

    // 에러 처리
    serialPort.on('error', (err) => {
      console.error('시리얼 포트 오류:', err.message);
      io.emit('serialError', err.message);
    });

    // 연결 종료 처리
    serialPort.on('close', () => {
      console.log('시리얼 포트 연결 종료');
      connectedPort = null;
      io.emit('serialDisconnected');
    });

  } catch (err) {
    console.error('포트 연결 오류:', err.message);
    io.emit('serialError', err.message);
  }
}

// 시리얼 포트 연결 종료
function disconnectPort() {
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
    connectedPort = null;
    return true;
  }
  return false;
}

// 데이터 전송
function sendData(data) {
  if (serialPort && serialPort.isOpen) {
    console.log('전송 데이터:', data);
    serialPort.write(data + '\n', (err) => {
      if (err) {
        console.error('데이터 전송 오류:', err.message);
        return false;
      }
      return true;
    });
  } else {
    console.error('연결된 포트 없음');
    return false;
  }
}

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨');
  
  // 현재 연결 상태 전송
  if (connectedPort) {
    socket.emit('serialConnected', connectedPort);
  }

  // 포트 목록 요청
  socket.on('listPorts', async () => {
    try {
      const ports = await listPorts();
      socket.emit('portsList', ports);
    } catch (err) {
      socket.emit('serialError', err.message);
    }
  });

  // 포트 연결 요청
  socket.on('connectPort', (portName) => {
    if (connectedPort) {
      disconnectPort();
    }
    connectToPort(portName);
  });

  // 포트 연결 종료 요청
  socket.on('disconnectPort', () => {
    const result = disconnectPort();
    socket.emit('disconnectResult', result);
  });

  // 데이터 전송 요청
  socket.on('sendData', (data) => {
    const result = sendData(data);
    socket.emit('sendResult', result);
  });

  // 연결 종료
  socket.on('disconnect', () => {
    console.log('클라이언트 연결 종료');
  });
});

// API 라우트
app.get('/api/ports', async (req, res) => {
  try {
    const ports = await listPorts();
    res.json(ports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ 
    connected: serialPort && serialPort.isOpen,
    port: connectedPort
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
