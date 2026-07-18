import React from 'react';

interface EnvironmentCardProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  visual: React.ReactNode;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface EnvironmentCardProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  visual: React.ReactNode;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  colorTheme?: 'blue' | 'purple' | 'green';
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  title,
  subtitle,
  visual,
  badge,
  onClick,
  disabled = false,
  colorTheme = 'blue'
}) => {
  const themeStyles = {
    blue: 'bg-[rgba(59,130,246,0.03)] dark:bg-[rgba(59,130,246,0.08)] hover:bg-[rgba(59,130,246,0.08)] dark:hover:bg-[rgba(59,130,246,0.15)] border-transparent dark:border-[rgba(59,130,246,0.25)]',
    purple: 'bg-[rgba(168,85,247,0.03)] dark:bg-[rgba(168,85,247,0.08)] hover:bg-[rgba(168,85,247,0.08)] dark:hover:bg-[rgba(168,85,247,0.15)] border-transparent dark:border-[rgba(168,85,247,0.25)]',
    green: 'bg-[rgba(34,197,94,0.03)] dark:bg-[rgba(34,197,94,0.08)] hover:bg-[rgba(34,197,94,0.08)] dark:hover:bg-[rgba(34,197,94,0.15)] border-transparent dark:border-[rgba(34,197,94,0.25)]'
  };

  const titleThemes = {
    blue: 'from-blue-500 to-slate-800 dark:from-white dark:via-blue-300 dark:to-slate-400',
    purple: 'from-purple-500 to-slate-800 dark:from-white dark:via-purple-300 dark:to-slate-400',
    green: 'from-green-500 to-slate-800 dark:from-white dark:via-green-300 dark:to-slate-400'
  };

  const borderThemes = {
    blue: 'border-blue-500 dark:border-blue-400',
    purple: 'border-purple-500 dark:border-purple-400',
    green: 'border-green-500 dark:border-green-400'
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative group flex flex-col p-8 h-full w-full overflow-hidden
        rounded-2xl border
        backdrop-blur-2xl shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${themeStyles[colorTheme]}
        ${disabled 
          ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' 
          : 'cursor-pointer hover:shadow-2xl hover:-translate-y-[4px] active:scale-[0.98] active:duration-100'}
      `}
    >
      {/* Beta Badge integrated into the top right corner */}
      {badge && (
        <div className="absolute top-6 right-6 px-3 py-1 text-xs uppercase tracking-widest font-mono font-bold text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-lg select-none backdrop-blur-md z-20 shadow-sm transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
          {badge}
        </div>
      )}
      
      {/* Massive cropped background icon */}
      <div className="absolute -top-10 -right-10 w-64 h-64 flex items-center justify-center text-[var(--text-faint)] opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 ease-out z-0 pointer-events-none">
        {visual}
      </div>

      {/* Content aligned to bottom left */}
      <div className="flex flex-col h-full justify-end z-10 relative mt-32" style={{ transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}>
        <div className="relative mb-6">
          <h2 className="absolute inset-0 text-[52px] md:text-[64px] font-black tracking-tight leading-[1.3] whitespace-pre-line text-transparent select-none" style={{ 
            textShadow: '0px 2px 4px rgba(0,0,0,0.1), 0px 1px 0px rgba(255,255,255,0.4)'
          }} aria-hidden="true">
            {title}
          </h2>
          <h2 className={`relative text-[52px] md:text-[64px] font-black tracking-tight leading-[1.3] whitespace-pre-line bg-clip-text text-transparent bg-gradient-to-b ${titleThemes[colorTheme]}`}>
            {title}
          </h2>
        </div>
        <p className={`text-sm md:text-base font-mono tracking-tight text-[var(--text-secondary)] whitespace-pre-line leading-relaxed border-l-[3px] ${borderThemes[colorTheme]} pl-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
