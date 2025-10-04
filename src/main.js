import './style.css';
import './game.js';

import { initAppKit } from './wallet/appKit.js';
import { setupUI } from './ui.js';

await initAppKit();

setupUI();
