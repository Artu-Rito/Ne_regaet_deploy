import React from 'react';

interface LoadingSpinnerProps {
  tip?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ tip = 'Загрузка...' }) => (
  <div className="flex flex-col items-center justify-center min-h-48 gap-3">
    <div className="w-10 h-10 border-2 border-[#2a2a50] border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-slate-400 text-sm">{tip}</span>
  </div>
);

export default LoadingSpinner;
