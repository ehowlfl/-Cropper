import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ColorPicker } from './color-picker/ColorPicker';
import { ModeSelector } from './color-picker/ModeSelector';
import { BleConnector } from './bluetooth/BleConnector';
import { ColorHistory } from './color-picker/ColorHistory';
import { DataView } from './color-picker/DataView';
import { ControlPanel } from './color-picker/ControlPanel';
import { useBleConnection } from '../hooks/useBleConnection';
import { useColorData } from '../hooks/useColorData';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';

export function ColorPickerApp() {
  const [mode, setMode] = useState<'data' | 'control'>('data');
  
  const colorData = useColorData();
  
  const { 
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
  } = useBleConnection({
    onDataReceived: (value) => {
      colorData.addReceivedData(value);
      toast.success(`수신: ${value}`);
    }
  });

  useEffect(() => {
    if (connectionError) {
      toast.error(`연결 오류: ${connectionError}`);
    }
  }, [connectionError]);

  const handleModeChange = (newMode: 'data' | 'control') => {
    setMode(newMode);
    toast.info(`${newMode === 'data' ? '데이터 모드' : '제어 모드'}로 전환됨`);
    
    if (server) {
      sendColorOverBLE(`MODE:${newMode.toUpperCase()}`);
    }
  };

  const handleColorSelected = (hex: string) => {
    if (server) {
      sendColorOverBLE(hex);
      toast.info(`색상 전송: ${hex}`);
    } else if (!server && !isConnecting) {
      toast.warning('HC-06 모듈에 연결되어 있지 않습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <header className="text-center">
          <motion.h1 
            className="text-4xl font-bold text-primary mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Color Picker
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            HC-06 블루투스 모듈을 통한 색상 선택 및 전송
          </motion.p>
        </header>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>HC-06 연결 안내</AlertTitle>
          <AlertDescription>
            브리지 서버를 먼저 실행한 후 HC-06 모듈을 연결하세요. 서버는 <code>npm run server</code> 명령으로 실행할 수 있습니다.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">📌 모드 설명</h2>
            <p className="mb-2"><strong>데이터 모드:</strong> 하드웨어에서 색상 값을 수신하고 저장, 필요시 다른 시스템으로 전송</p>
            <p><strong>제어 모드:</strong> 연결된 하드웨어를 제어하기 위한 색상 값과 명령 전송</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <BleConnector 
            connectBLE={connectBLE} 
            connectToPort={connectToPort}
            disconnect={disconnect}
            refreshPorts={refreshPorts}
            availablePorts={availablePorts}
            isConnected={!!server} 
            isConnecting={isConnecting}
            deviceName={device?.path || ''}
          />
          <div className="md:col-span-2">
            <ModeSelector mode={mode} onChange={handleModeChange} />
          </div>
        </div>

        <ColorPicker onColorSelected={handleColorSelected} />

        {mode === 'control' && (
          <ControlPanel 
            sendCommand={(command) => {
              sendColorOverBLE(command);
              return Promise.resolve();
            }} 
            isConnected={!!server} 
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorHistory history={colorData.history} />
          
          {mode === 'data' && (
            <DataView 
              receivedData={colorData.receivedData} 
              clearReceivedData={colorData.clearReceivedData}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}