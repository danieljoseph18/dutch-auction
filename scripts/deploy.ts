import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DutchAuction } from "../target/types/dutch_auction";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

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

  // Token configuration
  const TOKEN_DECIMALS = 9; // Adjust this based on your token's decimals
  const DECIMAL_MULTIPLIER = new anchor.BN(10).pow(
    new anchor.BN(TOKEN_DECIMALS)
  );

  // Define auction parameters (amounts are in actual tokens, will be converted to raw amounts)
  const ACTUAL_TOTAL_TOKENS = new anchor.BN(100_000_000);
  const BUCKETS = 100;
  const ACTUAL_TOKENS_PER_BUCKET = ACTUAL_TOTAL_TOKENS.div(
    new anchor.BN(BUCKETS)
  );

  // Convert to raw amounts including decimals
  const TOTAL_TOKENS = ACTUAL_TOTAL_TOKENS.mul(DECIMAL_MULTIPLIER);
  const TOKENS_PER_BUCKET = ACTUAL_TOKENS_PER_BUCKET.mul(DECIMAL_MULTIPLIER);

  // Rates are in raw token amounts per SOL
  const INITIAL_TOKENS_PER_SOL = new anchor.BN(541_125).mul(DECIMAL_MULTIPLIER);
  const FINAL_TOKENS_PER_SOL = new anchor.BN(270_562).mul(DECIMAL_MULTIPLIER);

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
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([auctionKeypair])
      .rpc();

    // Fetch the auction to get the start time
    const auctionAccount = await program.account.auction.fetch(
      auctionKeypair.publicKey
    );
    const startTime = auctionAccount.startTime;

    console.log("Transaction signature:", tx);
    console.log(
      "Dutch auction successfully initialized with the following parameters:"
    );
    console.log("  - Total tokens (actual):", ACTUAL_TOTAL_TOKENS.toString());
    console.log("  - Total tokens (raw):", TOTAL_TOKENS.toString());
    console.log("  - Number of buckets:", BUCKETS);
    console.log(
      "  - Tokens per bucket (actual):",
      ACTUAL_TOKENS_PER_BUCKET.toString()
    );
    console.log("  - Tokens per bucket (raw):", TOKENS_PER_BUCKET.toString());
    console.log(
      "  - Initial tokens per SOL (actual):",
      INITIAL_TOKENS_PER_SOL.div(DECIMAL_MULTIPLIER).toString()
    );
    console.log(
      "  - Final tokens per SOL (actual):",
      FINAL_TOKENS_PER_SOL.div(DECIMAL_MULTIPLIER).toString()
    );
    console.log(
      "  - Start time:",
      new Date(startTime.toNumber() * 1000).toISOString()
    );

    // Save auction info to file for future reference
    const auctionInfo = {
      auctionAddress: auctionKeypair.publicKey.toString(),
      authority: provider.wallet.publicKey.toString(),
      tokenDecimals: TOKEN_DECIMALS,
      totalTokensActual: ACTUAL_TOTAL_TOKENS.toString(),
      totalTokensRaw: TOTAL_TOKENS.toString(),
      buckets: BUCKETS,
      tokensPerBucketActual: ACTUAL_TOKENS_PER_BUCKET.toString(),
      tokensPerBucketRaw: TOKENS_PER_BUCKET.toString(),
      initialTokensPerSolActual:
        INITIAL_TOKENS_PER_SOL.div(DECIMAL_MULTIPLIER).toString(),
      initialTokensPerSolRaw: INITIAL_TOKENS_PER_SOL.toString(),
      finalTokensPerSolActual:
        FINAL_TOKENS_PER_SOL.div(DECIMAL_MULTIPLIER).toString(),
      finalTokensPerSolRaw: FINAL_TOKENS_PER_SOL.toString(),
      startTime: startTime.toString(),
      startTimeISO: new Date(startTime.toNumber() * 1000).toISOString(),
      txSignature: tx,
    };

    fs.writeFileSync("auction-info.json", JSON.stringify(auctionInfo, null, 2));
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
