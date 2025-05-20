import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bluetooth, BluetoothOff, Loader2, RefreshCw, Usb } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// 인라인으로 SerialPortInfo 타입 정의
interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
}

interface BleConnectorProps {
  connectBLE: () => Promise<void>;
  connectToPort?: (portName: string) => void;
  disconnect?: () => void;
  refreshPorts?: () => void;
  availablePorts?: SerialPortInfo[];
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string;
}

export function BleConnector({ 
  connectBLE, 
  connectToPort,
  disconnect,
  refreshPorts,
  availablePorts = [],
  isConnected, 
  isConnecting,
  deviceName
}: BleConnectorProps) {
  const [selectedPort, setSelectedPort] = useState<string>("");

  const handlePortSelect = (value: string) => {
    setSelectedPort(value);
    if (connectToPort) {
      connectToPort(value);
    }
  };

  const handleRefresh = () => {
    if (refreshPorts) {
      refreshPorts();
    }
  };

  const handleDisconnect = () => {
    if (disconnect) {
      disconnect();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <>
            <Button 
              onClick={connectBLE} 
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>연결 중...</span>
                </>
              ) : (
                <>
                  <Usb className="h-4 w-4" />
                  <span>HC-06 연결</span>
                </>
              )}
            </Button>

            {refreshPorts && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                title="포트 목록 새로고침"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <Button 
            variant="destructive" 
            onClick={handleDisconnect}
            className="flex items-center gap-2"
          >
            <BluetoothOff className="h-4 w-4" />
            <span>연결 해제</span>
          </Button>
        )}
        
        {isConnected && (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <Bluetooth className="h-3 w-3 mr-1" />
            {deviceName || 'Device'}
          </Badge>
        )}
      </div>

      {!isConnected && availablePorts && availablePorts.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedPort} onValueChange={handlePortSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="포트 선택" />
            </SelectTrigger>
            <SelectContent>
              {availablePorts.map((port) => (
                <SelectItem key={port.path} value={port.path}>
                  {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </motion.div>
  );
}