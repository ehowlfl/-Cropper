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

export function ColorPickerApp() {
  const [mode, setMode] = useState<'data' | 'control'>('data');
  
  const { 
    device, 
    server, 
    connectBLE, 
    sendColorOverBLE, 
    isConnecting,
    connectionError
  } = useBleConnection({
    onDataReceived: (value) => {
      colorData.addReceivedData(value);
      toast.success(`Received: ${value}`);
    }
  });
  
  const colorData = useColorData();

  useEffect(() => {
    if (connectionError) {
      toast.error(`Connection error: ${connectionError}`);
    }
  }, [connectionError]);

  const handleModeChange = (newMode: 'data' | 'control') => {
    setMode(newMode);
    toast.info(`Switched to ${newMode === 'data' ? 'Data Mode' : 'Control Mode'}`);
    
    if (server) {
      sendColorOverBLE(`MODE:${newMode.toUpperCase()}`);
    }
  };

  const handleColorSelected = (hex: string) => {
    if (mode === 'data' && server) {
      sendColorOverBLE(hex);
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
            Select, identify, and transmit colors via Bluetooth
          </motion.p>
        </header>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">📌 Mode Description</h2>
            <p className="mb-2"><strong>Data Mode:</strong> Receive and store color values from hardware, transmit to other systems when needed</p>
            <p><strong>Control Mode:</strong> Send color values and commands to control connected hardware</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <BleConnector 
            connectBLE={connectBLE} 
            isConnected={!!device} 
            isConnecting={isConnecting}
            deviceName={device?.name || ''}
          />
          <div className="md:col-span-2">
            <ModeSelector mode={mode} onChange={handleModeChange} />
          </div>
        </div>

        <ColorPicker onColorSelected={handleColorSelected} />

        {mode === 'control' && (
          <ControlPanel sendCommand={sendColorOverBLE} isConnected={!!server} />
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