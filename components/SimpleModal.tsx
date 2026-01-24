import React, { ReactNode } from 'react';

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const SimpleModal: React.FC<SimpleModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold font-oswald">{title}</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            &times;
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-brick-600 text-white rounded hover:bg-brick-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleModal;