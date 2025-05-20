import { useState, useCallback } from 'react';

// Web Bluetooth API 타입 정의
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        acceptAllDevices?: boolean;
        filters?: Array<{ services?: string[] }>;
        optionalServices?: string[];
      }): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    name?: string;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    writeValue(value: BufferSource): Promise<void>;
    readValue(): Promise<DataView>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    value?: DataView;
  }
}

interface UseBleConnectionProps {
  onDataReceived: (value: string) => void;
}

/**
 * HC-06 모듈 사용 시 주의사항:
 * 
 * Web Bluetooth API는 기본적으로 BLE(Bluetooth Low Energy)만 지원합니다.
 * HC-06은 Bluetooth Classic(SPP - Serial Port Profile)을 사용하므로 
 * 웹 브라우저에서 직접 연결할 수 없습니다.
 * 
 * 가능한 대안:
 * 1. 네이티브 앱(React Native, Electron 등)으로 전환
 * 2. 중간 서버/프록시 사용 (예: Node.js + noble/bleno 라이브러리)
 * 3. 하드웨어를 BLE 지원 모듈(예: HM-10)로 교체
 * 
 * 현재 이 훅은 데모용으로만 구현되어 있으며, 실제 HC-06과 통신하지 못합니다.
 */
export function useBleConnection({ onDataReceived }: UseBleConnectionProps) {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connectBLE = useCallback(async () => {
    if (!navigator.bluetooth) {
      setConnectionError("Bluetooth not supported in this browser");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // 주의: 이 코드는 HC-06과 실제로 연결되지 않습니다.
      // HC-06은 SPP(Serial Port Profile)을 사용하지만 Web Bluetooth API는 SPP를 지원하지 않습니다.
      const device = await navigator.bluetooth.requestDevice({
        // BLE 장치를 위한 필터
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // 예시 서비스
      });
      
      // 실제 연결 시도
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }
      
      setDevice(device);
      setServer(server);

      // 연결 해제 이벤트 리스너
      device.addEventListener('gattserverdisconnected', () => {
        setServer(null);
        setConnectionError("Device disconnected");
      });

      // 데모 목적으로 가상 데이터 수신 시뮬레이션
      // 실제 HC-06과는 통신할 수 없음을 명심하세요
      setTimeout(() => {
        onDataReceived('#FF5733'); // 가상 데이터 예시
      }, 2000);
      
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Unknown error");
      console.error("Bluetooth Connection Failed", error);
    } finally {
      setIsConnecting(false);
    }
  }, [onDataReceived]);

  const sendColorOverBLE = useCallback(async (hexOrCommand: string) => {
    if (!server) {
      throw new Error("Not connected to any device");
    }
    
    try {
      // 이 함수는 실제로 HC-06에 데이터를 보내지 않습니다
      // 데모 목적으로만 구현되어 있습니다
      console.log(`[시뮬레이션] HC-06으로 데이터 전송: ${hexOrCommand}`);
      
      // 가상 응답 시뮬레이션
      setTimeout(() => {
        if (hexOrCommand.startsWith('MODE:')) {
          onDataReceived(`ACK:${hexOrCommand}`);
        } else {
          onDataReceived(`SENT:${hexOrCommand}`);
        }
      }, 500);
      
      return true;
    } catch (error) {
      console.error("Bluetooth Send Error:", error);
      throw error;
    }
  }, [server, onDataReceived]);

  return {
    device,
    server,
    connectBLE,
    sendColorOverBLE,
    isConnecting,
    connectionError
  };
}