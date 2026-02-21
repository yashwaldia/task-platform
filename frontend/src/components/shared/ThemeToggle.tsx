// frontend/src/components/shared/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useUIStore } from '../../store/uiStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-[1.1rem] w-[1.1rem]" />
      ) : (
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      )}
    </Button>
  );
};

export default ThemeToggle;
