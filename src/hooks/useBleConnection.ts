import { useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// 시리얼 포트 타입 정의
interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
}

interface UseBleConnectionProps {
  onDataReceived: (value: string) => void;
}

/**
 * HC-06 블루투스 모듈과 통신하기 위한 훅
 * 
 * 이 훅은 로컬 브리지 서버를 통해 HC-06 모듈과 통신합니다.
 * 브리지 서버는 시리얼 포트를 통해 HC-06과 통신하고, 웹소켓을 통해 웹 앱과 통신합니다.
 */
export function useBleConnection({ onDataReceived }: UseBleConnectionProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<SerialPortInfo | null>(null);
  const [server, setServer] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);

  // 소켓 연결 설정
  useEffect(() => {
    // 브리지 서버 URL
    const serverUrl = 'http://localhost:3001';
    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      console.log('브리지 서버에 연결됨');
      // 연결 후 포트 목록 요청
      newSocket.emit('listPorts');
    });

    newSocket.on('disconnect', () => {
      console.log('브리지 서버와 연결 끊김');
      setServer(false);
      setDevice(null);
    });

    newSocket.on('portsList', (ports: SerialPortInfo[]) => {
      console.log('사용 가능한 포트:', ports);
      setAvailablePorts(ports);
    });

    newSocket.on('serialConnected', (portName: string) => {
      console.log(`포트 ${portName}에 연결됨`);
      const connectedDevice = availablePorts.find(port => port.path === portName) || { path: portName };
      setDevice(connectedDevice);
      setServer(true);
      setIsConnecting(false);
    });

    newSocket.on('serialDisconnected', () => {
      console.log('시리얼 포트 연결 종료');
      setDevice(null);
      setServer(false);
    });

    newSocket.on('serialData', (data: string) => {
      console.log('수신된 데이터:', data);
      onDataReceived(data);
    });

    newSocket.on('serialError', (error: string) => {
      console.error('시리얼 오류:', error);
      setConnectionError(error);
      setIsConnecting(false);
    });

    setSocket(newSocket);

    // 컴포넌트 언마운트 시 소켓 연결 종료
    return () => {
      newSocket.disconnect();
    };
  }, [onDataReceived]);

  // 포트 목록 갱신 요청
  const refreshPorts = useCallback(() => {
    if (socket) {
      socket.emit('listPorts');
    }
  }, [socket]);

  // HC-06 연결
  const connectBLE = useCallback(async () => {
    if (!socket) {
      setConnectionError("브리지 서버에 연결되지 않음");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // 포트 목록 요청
      socket.emit('listPorts');
      
      // 사용자에게 포트 선택 UI 표시 (이 부분은 실제 구현에서 UI 컴포넌트로 대체)
      // 여기서는 예시로 첫 번째 포트에 자동 연결
      socket.once('portsList', (ports: SerialPortInfo[]) => {
        if (ports.length > 0) {
          // 첫 번째 포트에 연결 시도
          const portToConnect = ports[0].path;
          console.log(`${portToConnect}에 연결 시도 중...`);
          socket.emit('connectPort', portToConnect);
        } else {
          setConnectionError("사용 가능한 시리얼 포트가 없습니다");
          setIsConnecting(false);
        }
      });
      
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "알 수 없는 오류");
      console.error("연결 실패", error);
      setIsConnecting(false);
    }
  }, [socket]);

  // 특정 포트에 연결
  const connectToPort = useCallback((portName: string) => {
    if (!socket) {
      setConnectionError("브리지 서버에 연결되지 않음");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    socket.emit('connectPort', portName);
  }, [socket]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (socket) {
      socket.emit('disconnectPort');
    }
  }, [socket]);

  // 데이터 전송
  const sendColorOverBLE = useCallback(async (hexOrCommand: string) => {
    if (!socket || !server) {
      throw new Error("연결된 장치가 없습니다");
    }
    
    try {
      console.log(`HC-06으로 데이터 전송: ${hexOrCommand}`);
      socket.emit('sendData', hexOrCommand);
      return true;
    } catch (error) {
      console.error("데이터 전송 오류:", error);
      throw error;
    }
  }, [socket, server]);

  return {
    device,
    server,
    connectBLE,
    sendColorOverBLE,
    isConnecting,
    connectionError,
    availablePorts,
    refreshPorts,
    connectToPort,
    disconnect
  };
}