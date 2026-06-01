import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { AnimationMode } from '../store/useBlenderStore';

export const WorkspaceAnimation: React.FC = () => {
  const animationMode = useBlenderStore((state) => state.animationMode);
  const setAnimationMode = useBlenderStore((state) => state.setAnimationMode);
  const currentFrame = useBlenderStore((state) => state.currentFrame);
  const totalFrames = useBlenderStore((state) => state.totalFrames);
  const setCurrentFrame = useBlenderStore((state) => state.setCurrentFrame);
  const isPlaying = useBlenderStore((state) => state.isPlaying);
  const setIsPlaying = useBlenderStore((state) => state.setIsPlaying);
  const advanceFrame = useBlenderStore((state) => state.advanceFrame);

  React.useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = window.setInterval(() => {
      advanceFrame();
    }, 120);
    return () => window.clearInterval(interval);
  }, [isPlaying, advanceFrame]);

  const handleTimelineDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(parseInt(e.target.value, 10));
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-auto bg-[#303030] border-t border-[#1D1D1D] flex flex-col pb-14">
      <div className="h-9 border-b border-[#1D1D1D] flex items-center justify-between px-4 bg-[#252525]">
        <div className="flex space-x-1">
          <button
            onClick={() => setAnimationMode('edit_bone')}
            className={`px-3 h-6 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
              animationMode === 'edit_bone' ? 'bg-[#E58E35] text-black' : 'bg-[#1D1D1D] text-gray-400'
            }`}
          >
            Bone Edit
          </button>
          <button
            onClick={() => setAnimationMode('weight_paint')}
            className={`px-3 h-6 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
              animationMode === 'weight_paint' ? 'bg-[#E58E35] text-black' : 'bg-[#1D1D1D] text-gray-400'
            }`}
          >
            Weight Paint
          </button>
        </div>
        <div className="text-[11px] font-mono text-gray-400 flex space-x-2">
          <span>Frame:</span>
          <span className="text-[#E58E35] font-bold">{currentFrame}</span>
          <span className="text-gray-600">/</span>
          <span>{totalFrames}</span>
        </div>
      </div>

      <div className="p-3 space-y-2 bg-[#1D1D1D]/40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-10 bg-[#1D1D1D] active:bg-[#E58E35] active:text-black rounded-lg flex items-center justify-center font-bold text-sm shadow-inner"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="flex-1 px-1">
            <input
              type="range"
              min="1"
              max={totalFrames}
              value={currentFrame}
              onChange={handleTimelineDrag}
              className="w-full accent-[#E58E35] bg-[#1D1D1D] h-4 rounded appearance-none cursor-pointer border border-[#303030]"
            />
          </div>
        </div>

        <div className="h-6 w-full relative overflow-hidden bg-[#141414] rounded border border-[#252525] px-1 flex items-center">
          <div className="absolute top-0 bottom-0 bg-[#E58E35]/20 border-l border-[#E58E35]" style={{ left: `${(currentFrame / totalFrames) * 100}%` }} />
          <div className="w-full flex justify-between text-[8px] font-mono text-gray-600 select-none pointer-events-none">
            <span>1</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>250</span>
          </div>
        </div>
      </div>
    </div>
  );
};
