import { appKit } from './wallet/appKit.js';
import { wireWalletUI } from './wallet/uiControls.js';

export function setupUI() {
  wireWalletUI();

  const connectBtn = document.getElementById('connect-wallet');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      appKit.open();
    });
  }
}
