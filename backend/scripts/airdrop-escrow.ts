import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const escrowPubkey = process.env.ESCROW_PUBLIC_KEY;

if (!escrowPubkey) {
  throw new Error("Set ESCROW_PUBLIC_KEY before running airdrop");
}

const connection = new Connection(rpcUrl, "confirmed");

async function main() {
  const pubkey = new PublicKey(escrowPubkey);

  const [sig, latest] = await Promise.all([
    connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL),
    connection.getLatestBlockhash("confirmed"),
  ]);

  const conf = await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
  if (conf.value.err) throw new Error("Airdrop failed");

  const bal = await connection.getBalance(pubkey, "confirmed");
  console.log("Airdrop signature:", sig);
  console.log("Escrow balance (SOL):", bal / LAMPORTS_PER_SOL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

