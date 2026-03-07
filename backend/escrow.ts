import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import "dotenv/config"

const ESCROW_PRIVATE_KEY = process.env.ESCROW_PRIVATE_KEY;
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

let keypair: Keypair | null = null;

function getKeypair(): Keypair {
    if (!ESCROW_PRIVATE_KEY) {
        throw new Error("ESCROW_PRIVATE_KEY is not set in environment");
    }
    if (!keypair) {
        const secret = bs58.decode(ESCROW_PRIVATE_KEY);
        keypair = Keypair.fromSecretKey(secret);
    }
    return keypair;
}

export function getEscrowPublicKey(): string {
    return getKeypair().publicKey.toBase58();
}

export async function sendSolTo(toAddress: string, lamports: bigint): Promise<string> {
    const connection = new Connection(SOLANA_RPC);
    const kp = getKeypair();
    const toPubkey = new PublicKey(toAddress);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: kp.publicKey,
            toPubkey,
            lamports,
        })
    );

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = kp.publicKey;

    const signature = await connection.sendTransaction(transaction, [kp], {
        skipPreflight: false,
        preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(signature, "confirmed");
    return signature;
}
