import { useState, useEffect, useCallback } from 'react';
import { getClosestColorName, hexToRgb } from '../lib/colorUtils';

interface ColorHistoryItem {
  hex: string;
  name: string;
}

export function useColorData() {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  const [receivedData, setReceivedData] = useState<string[]>(() => {
    const saved = localStorage.getItem("receivedData");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("receivedData", JSON.stringify(receivedData));
  }, [receivedData]);

  const addHistoryItem = useCallback((hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    const name = getClosestColorName(r, g, b);
    setHistory(prev => [{ hex, name }, ...prev.slice(0, 19)]);
  }, []);

  const addReceivedData = useCallback((value: string) => {
    let parsed = value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const [r, g, b] = hexToRgb(value);
      const name = getClosestColorName(r, g, b);
      parsed = `${value} → ${name}`;
      
      // Also add to history if it's a color
      addHistoryItem(value);
    }

    setReceivedData(prev => [parsed, ...prev.slice(0, 49)]);
  }, [addHistoryItem]);

  const clearReceivedData = useCallback(() => {
    setReceivedData([]);
    localStorage.removeItem("receivedData");
  }, []);

  return {
    history,
    receivedData,
    addHistoryItem,
    addReceivedData,
    clearReceivedData
  };
}