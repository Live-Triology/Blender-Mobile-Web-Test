import { useEffect, useRef } from 'react';
import { useBlenderStore } from '../store/useBlenderStore';

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  startAngle: number;
  isDragging: boolean;
  moved: boolean;
  startTime: number;
  lastTapTime: number;
}

export function useTouchGestureProcessor(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  cameraMatrices: {
    orbit: (dx: number, dy: number) => void;
    zoom: (factor: number) => void;
    pan: (dx: number, dy: number) => void;
    raycastSelect: (x: number, y: number) => void;
  }
) {
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    startAngle: 0,
    isDragging: false,
    lastTapTime: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getMidpoint = (t1: Touch, t2: Touch) => {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;
      touchState.current.moved = false;
      touchState.current.startTime = window.performance.now();

      if (touches.length === 1) {
        touchState.current.startX = touches[0].clientX;
        touchState.current.startY = touches[0].clientY;
        touchState.current.isDragging = true;
      } else if (touches.length === 2) {
        touchState.current.startDistance = getDistance(touches[0], touches[1]);
        const mid = getMidpoint(touches[0], touches[1]);
        touchState.current.startX = mid.x;
        touchState.current.startY = mid.y;
        touchState.current.isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchState.current.isDragging) return;
      e.preventDefault();
      const touches = e.touches;
      touchState.current.moved = true;

      if (touches.length === 1) {
        const dx = touches[0].clientX - touchState.current.startX;
        const dy = touches[0].clientY - touchState.current.startY;
        cameraMatrices.orbit(dx * 0.005, dy * 0.005);
        touchState.current.startX = touches[0].clientX;
        touchState.current.startY = touches[0].clientY;
      } else if (touches.length === 2) {
        const currentDist = getDistance(touches[0], touches[1]);
        const factor = currentDist / touchState.current.startDistance;
        cameraMatrices.zoom(factor);
        touchState.current.startDistance = currentDist;

        const mid = getMidpoint(touches[0], touches[1]);
        const dx = mid.x - touchState.current.startX;
        const dy = mid.y - touchState.current.startY;
        cameraMatrices.pan(dx * 0.012, dy * 0.012);
        touchState.current.startX = mid.x;
        touchState.current.startY = mid.y;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        const endTime = window.performance.now();
        const duration = endTime - touchState.current.startTime;
        const moved = touchState.current.moved;
        touchState.current.isDragging = false;

        if (!moved && duration < 250) {
          const rect = canvas.getBoundingClientRect();
          const x = touchState.current.startX - rect.left;
          const y = touchState.current.startY - rect.top;
          cameraMatrices.raycastSelect(x, y);
        }
      } else if (e.touches.length === 1) {
        touchState.current.startX = e.touches[0].clientX;
        touchState.current.startY = e.touches[0].clientY;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef, cameraMatrices]);
}
