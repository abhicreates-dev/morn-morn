import { Router } from "express";
import { DEPOSIT_LAMPORTS, DEPOSIT_SOL, SOLANA_RPC_URL, getEscrowPublicKey } from "../solana";

const router = Router();

router.get("/config", (_req, res) => {
  try {
    res.json({
      cluster: "devnet",
      rpcUrl: SOLANA_RPC_URL,
      escrowAddress: getEscrowPublicKey().toBase58(),
      depositSol: DEPOSIT_SOL,
      depositLamports: DEPOSIT_LAMPORTS,
    });
  } catch (e) {
    res.status(500).json({ message: "Escrow wallet not configured" });
  }
});

export { router as solanaRouter };

