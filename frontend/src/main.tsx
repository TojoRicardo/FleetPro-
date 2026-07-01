import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import '@/index.css';
import { applyTheme } from '@/theme/applyTheme';
import { getInitialTheme } from '@/theme/theme';

applyTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <App />
);
