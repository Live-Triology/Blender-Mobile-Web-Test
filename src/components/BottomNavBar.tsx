import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { WorkspaceTab } from '../store/useBlenderStore';

export const BottomNavBar: React.FC = () => {
  const currentTab = useBlenderStore((state) => state.currentTab);
  const setTab = useBlenderStore((state) => state.setTab);

  const navigationTabs: { id: WorkspaceTab; label: string; icon: string }[] = [
    { id: 'layout', label: 'Layout', icon: '⛶' },
    { id: 'sculpt', label: 'Sculpt', icon: '⛰' },
    { id: 'shading', label: 'Shading', icon: '🔮' },
    { id: 'animation', label: 'Animate', icon: '🎬' },
  ];

  return (
    <footer className="fixed bottom-0 inset-x-0 h-14 bg-[#303030] border-t border-[#1D1D1D] grid grid-cols-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {navigationTabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center space-y-0.5 border-t-2 transition-all ${
              isActive 
                ? 'border-[#E58E35] bg-[#1D1D1D] text-[#E58E35]' 
                : 'border-transparent text-gray-400 active:bg-[#252525]'
            }`}
          >
            <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>{tab.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </footer>
  );
};
