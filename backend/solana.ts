import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const DEFAULT_DEVNET_RPC_URL = "https://api.devnet.solana.com";

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || DEFAULT_DEVNET_RPC_URL;
export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export const DEPOSIT_SOL = 0.1;
export const DEPOSIT_LAMPORTS = Math.round(DEPOSIT_SOL * LAMPORTS_PER_SOL);

function loadEscrowKeypair(): Keypair {
  const raw = process.env.ESCROW_SECRET_KEY;
  if (!raw) {
    throw new Error("Missing ESCROW_SECRET_KEY");
  }

  // Supports:
  // - JSON array: "[1,2,3,...]"
  // - base58: "3n8...abc"
  const bytes: Uint8Array = raw.trim().startsWith("[")
    ? Uint8Array.from(JSON.parse(raw) as number[])
    : bs58.decode(raw.trim());

  return Keypair.fromSecretKey(bytes);
}

export function getEscrowPublicKey(): PublicKey {
  const envPubkey = process.env.ESCROW_PUBLIC_KEY;
  if (envPubkey) return new PublicKey(envPubkey);
  return loadEscrowKeypair().publicKey;
}

export async function verifyDevnetDepositTx(params: {
  signature: string;
  expectedFrom: string;
  expectedTo: string;
  expectedLamports: number;
}): Promise<{ slot: number }> {
  const { signature, expectedFrom, expectedTo, expectedLamports } = params;

  const tx = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    throw new Error("Transaction not found on devnet");
  }
  if (tx.meta?.err) {
    throw new Error("Transaction failed");
  }

  const from = expectedFrom;
  const to = expectedTo;

  const hasMatchingTransfer = (tx.transaction.message.instructions || []).some((ix) => {
    if ("parsed" in ix) {
      const parsed: any = ix.parsed;
      const program: any = (ix as any).program;
      if (program !== "system") return false;
      if (!parsed || parsed.type !== "transfer") return false;
      const info = parsed.info;
      const lamports = Number(info?.lamports);
      return (
        info?.source === from &&
        info?.destination === to &&
        Number.isFinite(lamports) &&
        lamports === expectedLamports
      );
    }
    return false;
  });

  if (!hasMatchingTransfer) {
    throw new Error("Deposit transfer not found or amount mismatch");
  }

  return { slot: tx.slot };
}

export async function sendEscrowPayout(params: { to: string; lamports: number }): Promise<string> {
  const { to, lamports } = params;
  const escrow = loadEscrowKeypair();

  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    ...latest,
    feePayer: escrow.publicKey,
  }).add(
    SystemProgram.transfer({
      fromPubkey: escrow.publicKey,
      toPubkey: new PublicKey(to),
      lamports,
    }),
  );

  const sig = await connection.sendTransaction(tx, [escrow], {
    preflightCommitment: "confirmed",
  });

  const confirmation = await connection.confirmTransaction(
    { signature: sig, ...latest },
    "confirmed",
  );
  if (confirmation.value.err) {
    throw new Error("Escrow payout failed");
  }

  return sig;
}

