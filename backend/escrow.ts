import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";

const ESCROW_PRIVATE_KEY = process.env.ESCROW_PRIVATE_KEY;
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

/** Seeker (SKR) token mint - API ID: seeker */
export const SEEKER_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
/** Stake amount in token base units (e.g. 1 SKR with 6 decimals = 1_000_000) */
export const STAKE_SKR_RAW = "1000000";
export const SEEKER_DECIMALS = 6;

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

/** Returns the escrow's Associated Token Account for the given mint. */
export function getEscrowTokenAccount(mintAddress: string): string {
    const kp = getKeypair();
    const mint = new PublicKey(mintAddress);
    const ata = getAssociatedTokenAddressSync(mint, kp.publicKey);
    return ata.toBase58();
}

/** Sends SPL tokens from escrow's ATA to the recipient's wallet (their ATA for that mint). */
export async function sendTokenTo(
    toAddress: string,
    mintAddress: string,
    amountRaw: string,
    decimals: number = SEEKER_DECIMALS
): Promise<string> {
    const connection = new Connection(SOLANA_RPC);
    const kp = getKeypair();
    const mint = new PublicKey(mintAddress);
    const toPubkey = new PublicKey(toAddress);

    const sourceAta = getAssociatedTokenAddressSync(mint, kp.publicKey);
    const destAta = getAssociatedTokenAddressSync(mint, toPubkey);

    const ix = createTransferCheckedInstruction(
        sourceAta,
        mint,
        destAta,
        kp.publicKey,
        BigInt(amountRaw),
        decimals
    );

    const transaction = new Transaction().add(ix);
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
