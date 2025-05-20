import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bluetooth, BluetoothOff, Loader2 } from 'lucide-react';

interface BleConnectorProps {
  connectBLE: () => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string;
}

export function BleConnector({ 
  connectBLE, 
  isConnected, 
  isConnecting,
  deviceName
}: BleConnectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <Button 
        onClick={connectBLE} 
        disabled={isConnected || isConnecting}
        className="flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            {isConnected ? <Bluetooth className="h-4 w-4" /> : <BluetoothOff className="h-4 w-4" />}
            <span>Connect BLE</span>
          </>
        )}
      </Button>
      
      {isConnected && (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Connected: {deviceName || 'Device'}
        </Badge>
      )}
    </motion.div>
  );
}