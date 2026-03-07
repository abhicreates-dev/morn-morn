import { useState, useCallback } from "react";
import {
    transact,
    Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
} from "@solana/web3.js";

const APP_IDENTITY = {
    name: "Morn Morn",
    uri: "https://mornmorn.app",
    icon: "favicon.ico",
};

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export function useWallet() {
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [sending, setSending] = useState(false);

    const cluster = "devnet";
    const connection = new Connection(clusterApiUrl(cluster), "confirmed");

    const connect = useCallback(async () => {
        setConnecting(true);
        try {
            const authResult = await transact(async (wallet: Web3MobileWallet) => {
                const result = await wallet.authorize({
                    chain: `solana:${cluster}`,
                    identity: APP_IDENTITY,
                });
                return result;
            });

            const pubkey = new PublicKey(
                Buffer.from(authResult.accounts[0].address, "base64")
            );
            setPublicKey(pubkey);
            return pubkey;
        } catch (error) {
            console.error("Connect failed:", error);
            throw error;
        } finally {
            setConnecting(false);
        }
    }, [cluster]);

    const disconnect = useCallback(() => {
        setPublicKey(null);
    }, []);

    const stakeSOL = useCallback(
        async (
            escrowAddress: string,
            amountSOL: number,
            taskId: string,
            fromPubkeyOverride?: PublicKey
        ) => {
            const fromPubkey = fromPubkeyOverride ?? publicKey;
            if (!fromPubkey) throw new Error("Wallet not connected");

            setSending(true);
            try {
                const toPublicKey = new PublicKey(escrowAddress);
                const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

                const memoIx = new TransactionInstruction({
                    keys: [],
                    programId: MEMO_PROGRAM_ID,
                    data: Buffer.from(taskId, "utf8"),
                });

                const transaction = new Transaction()
                    .add(
                        SystemProgram.transfer({
                            fromPubkey: fromPubkey,
                            toPubkey: toPublicKey,
                            lamports,
                        })
                    )
                    .add(memoIx);

                const { blockhash } = await connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = fromPubkey;

                const txSignature = await transact(
                    async (wallet: Web3MobileWallet) => {
                        await wallet.authorize({
                            chain: `solana:${cluster}`,
                            identity: APP_IDENTITY,
                        });

                        const signatures =
                            await wallet.signAndSendTransactions({
                                transactions: [transaction],
                            });
                        return signatures[0];
                    }
                );

                return txSignature;
            } finally {
                setSending(false);
            }
        },
        [publicKey, connection, cluster]
    );

    return {
        publicKey,
        connected: !!publicKey,
        connecting,
        sending,
        connect,
        disconnect,
        stakeSOL,
        connection,
    };
}
