import React, { useState, useEffect } from 'react';

interface CalibrationDialogProps {
  isOpen: boolean;
  onConfirm: (distance: number) => void;
  onCancel: () => void;
  pixelDistance: number;
}

const CalibrationDialog: React.FC<CalibrationDialogProps> = ({ isOpen, onConfirm, onCancel, pixelDistance }) => {
  const [distance, setDistance] = useState<string>('');

  // Reset when opened
  useEffect(() => {
    if(isOpen) setDistance('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(distance);
    if (!isNaN(val) && val > 0) {
      onConfirm(val);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-600 w-96">
        <h3 className="text-xl font-bold text-white mb-2">Calibrate Scale</h3>
        <p className="text-gray-400 text-sm mb-4">
          You drew a line of <strong>{pixelDistance.toFixed(1)} pixels</strong>. 
          How many feet does this represent in the real world?
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1 uppercase">Distance (Feet)</label>
            <input 
              type="number" 
              autoFocus
              step="any"
              value={distance} 
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none text-lg"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!distance || parseFloat(distance) <= 0}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Scale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalibrationDialog;