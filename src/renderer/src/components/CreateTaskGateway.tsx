import React from 'react';
import { LayoutTemplate, Monitor, Fingerprint } from 'lucide-react';
import { ParticleBackground } from './gateway/ParticleBackground';
import { TypewriterTitle } from './gateway/TypewriterTitle';
import { EnvironmentCard } from './gateway/EnvironmentCard';

interface CreateTaskGatewayProps {
  onSelectEnvironment: (env: 'web' | 'desktop') => void;
}

const CreateTaskGateway: React.FC<CreateTaskGatewayProps> = ({ onSelectEnvironment }) => {
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#121216] transition-colors duration-300">
      {/* Full-screen Particle Background */}
      <ParticleBackground />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col w-full h-full p-8 lg:p-16">
        
        {/* Top 1/3: Logo & Title */}
        <div className="flex-none flex flex-col justify-end items-center h-1/3 min-h-[200px] pb-10 -translate-y-[10px]">
          <div className="flex items-center gap-4 mb-10 opacity-90">
            <img src="./logo.png" className="w-[54px] h-[54px] object-contain drop-shadow-md" style={{ imageRendering: 'high-quality' as any, transform: 'translateZ(0)' }} alt="Argus Logo" />
            <span className="text-[42px] drop-shadow-md text-[var(--text-primary)] pr-1" style={{ fontFamily: '"Pacifico", cursive' }}>
              Argus
            </span>
          </div>
          <TypewriterTitle />
        </div>

        {/* Bottom 2/3: Split Screen Cards */}
        <div className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
          <EnvironmentCard
            title={"网页\n自动化"}
            subtitle={"Browser Automation\nDriven by CDP / DOM"}
            visual={<LayoutTemplate className="w-full h-full stroke-[0.5]" />}
            colorTheme="blue"
            onClick={() => onSelectEnvironment('web')}
          />
          
          <EnvironmentCard
            title={"桌面\n自动化"}
            subtitle={"Desktop Automation\nDriven by UIA / Vision"}
            visual={<Monitor className="w-full h-full stroke-[0.5]" />}
            badge="Beta"
            colorTheme="purple"
            onClick={() => onSelectEnvironment('desktop')}
          />
        </div>
        
      </div>
    </div>
  );
};

export default CreateTaskGateway;
