import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

export const DEPOSIT_SOL = 0.1;
export const DEPOSIT_LAMPORTS = Math.round(DEPOSIT_SOL * LAMPORTS_PER_SOL);

const APP_IDENTITY = {
  name: 'Morn Morn',
  uri: 'https://morn-morn.local',
};

export async function depositToEscrow(params: {
  rpcUrl: string;
  escrowAddress: string;
}): Promise<{ signature: string; walletAddress: string }> {
  const { rpcUrl, escrowAddress } = params;
  const connection = new Connection(rpcUrl, 'confirmed');

  const escrowPubkey = new PublicKey(escrowAddress);

  const [signature, walletAddress] = await transact(async (wallet) => {
    const authResult = await wallet.authorize({
      cluster: 'devnet',
      identity: APP_IDENTITY,
    });

    const payerAddress = authResult.accounts[0]?.address;
    if (!payerAddress) {
      throw new Error('No wallet account returned');
    }
    const payer = new PublicKey(payerAddress);

    const latest = await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction({
      ...latest,
      feePayer: payer,
    }).add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: escrowPubkey,
        lamports: DEPOSIT_LAMPORTS,
      }),
    );

    const sigs = await wallet.signAndSendTransactions({
      transactions: [tx],
    });

    return [sigs[0], payerAddress] as const;
  });

  const latest = await connection.getLatestBlockhash('confirmed');
  const confirmation = await connection.confirmTransaction({ signature, ...latest }, 'confirmed');
  if (confirmation.value.err) {
    throw new Error('Deposit transaction failed');
  }

  return { signature, walletAddress };
}

