import { base } from 'viem/chains';
import { createWalletClient, http } from 'viem';
import { appKit, getWalletState, publicClient } from './appKit.js';
import abi from '../contract/abi.js';

const CONTRACT_ADDRESS = '0xe5b742f5f72b1cb7b80862e685936887f8cc772f';

function getActiveAddress() {
  const state = getWalletState();
  const connection = state?.connections?.[0];
  return connection?.accounts?.[0]?.address;
}

export function isWalletConnected() {
  return Boolean(getActiveAddress());
}

export function getConnectedAddress() {
  return getActiveAddress();
}

export function initWalletControls() {
  const connectBtn = document.getElementById('connect-wallet');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      await ensureConnected();
      refreshWalletUI();
    });
  }

  const saveBtn = document.getElementById('save-score');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      try {
        const score = parseInt(document.getElementById('final-score').textContent, 10) || 0;
        const ethCollected = parseInt(document.getElementById('eth-collected').textContent, 10) || 0;
        const distance = parseInt(document.getElementById('distance-traveled').textContent, 10) || 0;
        await saveScore({ score, ethCollected, distance });
        alert('Score submitted to Base!');
      } catch (error) {
        console.error('Failed to save score', error);
        alert(error.message || 'Failed to save score');
      }
    });
  }
}

export async function saveScore({ score, ethCollected, distance }) {
  const address = getActiveAddress();
  if (!address) throw new Error('Connect wallet first');

  const walletClient = createWalletClient({
    account: address,
    chain: base,
    transport: http(),
  });

  return walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'saveScore',
    args: [score, ethCollected, distance],
  });
}

export async function fetchPlayerBestScore() {
  const address = getActiveAddress();
  if (!address) return null;

  const [bestScore, bestEth, bestDistance, timestamp] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'getPlayerBestScore',
    args: [address],
  });

  return {
    bestScore: Number(bestScore),
    bestEth: Number(bestEth),
    bestDistance: Number(bestDistance),
    timestamp: Number(timestamp),
  };
}

export function refreshWalletUI() {
  const address = getConnectedAddress();
  const connectBtn = document.getElementById('connect-wallet');
  const addressEl = document.getElementById('wallet-address');
  const saveBtn = document.getElementById('save-score');

  if (address && addressEl && connectBtn) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    addressEl.textContent = shortAddress;
    connectBtn.textContent = 'Connected';
    if (saveBtn) saveBtn.disabled = false;
  } else {
    if (addressEl) addressEl.textContent = 'Not connected';
    if (connectBtn) connectBtn.textContent = 'Connect Wallet';
    if (saveBtn) saveBtn.disabled = true;
  }
}

async function ensureConnected() {
  if (isWalletConnected()) return;
  await appKit.open({ view: 'Connect' });
}
