import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import { WorkspaceLayout } from './WorkspaceLayout';
import { WorkspaceSculpt } from './WorkspaceSculpt';
import { WorkspaceShading } from './WorkspaceShading';
import { WorkspaceAnimation } from './WorkspaceAnimation';
import { ViewportCanvas } from './ViewportCanvas';
import { BottomNavBar } from './BottomNavBar';

export const AppContainer: React.FC = () => {
  const currentTab = useBlenderStore((state) => state.currentTab);

  return (
    <div className="w-full h-full relative">
      <ViewportCanvas />

      {currentTab === 'layout' && <WorkspaceLayout />}
      {currentTab === 'sculpt' && <WorkspaceSculpt />}
      {currentTab === 'shading' && <WorkspaceShading />}
      {currentTab === 'animation' && <WorkspaceAnimation />}

      <BottomNavBar />
    </div>
  );
};
