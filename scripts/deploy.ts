import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DutchAuction } from "../target/types/dutch_auction";
import * as fs from 'fs';

async function main() {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program instance
  const program = anchor.workspace.DutchAuction as Program<DutchAuction>;
  console.log("Program ID:", program.programId.toString());

  // Generate new keypair for the auction
  const auctionKeypair = anchor.web3.Keypair.generate();
  console.log("Auction address:", auctionKeypair.publicKey.toString());

  // Define auction parameters
  const TOTAL_TOKENS = new anchor.BN(100_000_000);
  const BUCKETS = 100;
  const TOKENS_PER_BUCKET = new anchor.BN(1_000_000);
  const INITIAL_TOKENS_PER_SOL = new anchor.BN(541_125);
  const FINAL_TOKENS_PER_SOL = new anchor.BN(270_562);

  try {
    // Initialize the auction
    const tx = await program.methods
      .initialize(
        TOTAL_TOKENS,
        BUCKETS,
        TOKENS_PER_BUCKET,
        INITIAL_TOKENS_PER_SOL,
        FINAL_TOKENS_PER_SOL
      )
      .accountsStrict({
        auction: auctionKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([auctionKeypair])
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Dutch auction successfully initialized with the following parameters:");
    console.log("  - Total tokens:", TOTAL_TOKENS.toString());
    console.log("  - Number of buckets:", BUCKETS);
    console.log("  - Tokens per bucket:", TOKENS_PER_BUCKET.toString());
    console.log("  - Initial tokens per SOL:", INITIAL_TOKENS_PER_SOL.toString());
    console.log("  - Final tokens per SOL:", FINAL_TOKENS_PER_SOL.toString());
    
    // Save auction info to file for future reference
    const auctionInfo = {
      auctionAddress: auctionKeypair.publicKey.toString(),
      authority: provider.wallet.publicKey.toString(),
      totalTokens: TOTAL_TOKENS.toString(),
      buckets: BUCKETS,
      tokensPerBucket: TOKENS_PER_BUCKET.toString(),
      initialTokensPerSol: INITIAL_TOKENS_PER_SOL.toString(),
      finalTokensPerSol: FINAL_TOKENS_PER_SOL.toString(),
      txSignature: tx
    };
    
    fs.writeFileSync('auction-info.json', JSON.stringify(auctionInfo, null, 2));
    console.log("Auction info saved to auction-info.json");
    
  } catch (error) {
    console.error("Error initializing auction:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);