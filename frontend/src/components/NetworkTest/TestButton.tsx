import React from 'react';

interface TestButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

const TestButton: React.FC<TestButtonProps> = ({ onClick, loading, disabled }) => (
  <div className="text-center py-8">
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-32 h-32 rounded-full text-sm font-bold uppercase tracking-widest border-2 transition-all duration-300
        ${loading
          ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 animate-pulse cursor-wait'
          : 'border-indigo-500 text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]'
        }
      `}
    >
      {loading ? 'Тест...' : '▶ ТЕСТ'}
    </button>
    <p className="mt-4 text-slate-400 text-sm">
      {loading ? 'Измеряю задержку...' : 'Нажмите для начала теста'}
    </p>
  </div>
);

export default TestButton;
