import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Zap, 
  ZapOff, 
  RefreshCw, 
  Send, 
  Sliders 
} from 'lucide-react';
import { toast } from 'sonner';

interface ControlPanelProps {
  sendCommand: (command: string) => Promise<void>;
  isConnected: boolean;
}

export function ControlPanel({ sendCommand, isConnected }: ControlPanelProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendCommand = async (command: string) => {
    if (!isConnected) {
      toast.error("Not connected to any device");
      return;
    }

    setIsSending(true);
    try {
      await sendCommand(command);
      toast.success(`Command sent: ${command}`);
    } catch (error) {
      toast.error(`Failed to send command: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={18} />
            <h2 className="text-xl font-semibold">Control Commands</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="default" 
              onClick={() => handleSendCommand("COLOR")}
              className="flex items-center gap-2"
              disabled={isSending || !isConnected}
            >
              <Send size={16} />
              <span>Send Color</span>
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => handleSendCommand("ON")}
              className="flex items-center gap-2"
              disabled={isSending || !isConnected}
            >
              <Zap size={16} />
              <span>LED ON</span>
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => handleSendCommand("OFF")}
              className="flex items-center gap-2"
              disabled={isSending || !isConnected}
            >
              <ZapOff size={16} />
              <span>LED OFF</span>
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => handleSendCommand("MODE:CONTROL")}
              className="flex items-center gap-2"
              disabled={isSending || !isConnected}
            >
              <RefreshCw size={16} />
              <span>Reset Device</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}