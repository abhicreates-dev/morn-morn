import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const kp = Keypair.generate();

console.log("ESCROW_PUBLIC_KEY=" + kp.publicKey.toBase58());
console.log("");
console.log("# Use ONE of the following formats for ESCROW_SECRET_KEY:");
console.log("ESCROW_SECRET_KEY_BASE58=" + bs58.encode(kp.secretKey));
console.log("ESCROW_SECRET_KEY_JSON=" + JSON.stringify(Array.from(kp.secretKey)));

