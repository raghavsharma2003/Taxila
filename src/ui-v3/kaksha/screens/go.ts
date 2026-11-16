// One way to move between Kaksha screens (r7 app-motion-transitions): React Router's navigate with a View Transition, so
// the screen crossfades and her window (view-transition-name kx-asha, on Home, Your teacher and the lesson's stage) morphs
// from one place to the next. Reduced motion (the OS setting, or Me → Less motion) navigates with no transition at all.
// A browser without View Transitions navigates as before (React Router checks document.startViewTransition).
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useKxGo(reducedMotion: boolean): (to: string) => void {
  const nav = useNavigate();
  return useCallback((to: string) => { void nav(to, { viewTransition: !reducedMotion }); }, [nav, reducedMotion]);
}
