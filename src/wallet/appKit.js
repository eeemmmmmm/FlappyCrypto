import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from 'viem/chains';
import { QueryClient } from '@tanstack/react-query';
import { createPublicClient, http as viemHttp } from 'viem';

export const CONTRACT_ADDRESS = '0xe5b742f5f72b1cb7b80862e685936887f8cc772f';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('WalletConnect project ID is missing. Set VITE_WALLETCONNECT_PROJECT_ID in your .env file.');
}

const adapter = new WagmiAdapter({
  projectId,
  networks: [base],
});

export const queryClient = new QueryClient();

export const publicClient = createPublicClient({
  chain: base,
  transport: viemHttp('https://mainnet.base.org'),
});

export let appKit;

export async function initAppKit() {
  if (appKit) return appKit;

  appKit = createAppKit({
    projectId,
    metadata: {
      name: 'Flippy Flappy Crypto',
      description: 'Skill-based Base mini-game integrated with WalletConnect AppKit.',
      url: 'https://github.com/eeemmmmmm/flappycrypto',
      icons: ['https://walletconnect.com/walletconnect-logo.png'],
    },
    networks: [base],
    adapters: [adapter],
    themeMode: 'dark',
    features: {
      analytics: true,
      email: false,
    },
  });

  await adapter.syncConnections();

  return appKit;
}

export function getWalletState() {
  return appKit?.getState();
}

export function getWalletBalance(address) {
  if (!address) return Promise.resolve(null);
  return adapter.getBalance({ address, chainId: base.id });
}
