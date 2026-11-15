import './style.css';
import { App } from './ui/app.ts';

const root = document.getElementById('app');
if (root) {
  const app = new App(root);
  app.goTitle();
  // Expose for debugging from the console (`__kiritsu.progress`, etc).
  (window as unknown as { __kiritsu: App }).__kiritsu = app;
}
