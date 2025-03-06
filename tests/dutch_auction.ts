import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DutchAuction } from "../target/types/dutch_auction";
import { expect } from "chai";

describe("dutch_auction", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DutchAuction as Program<DutchAuction>;
  const auctionKeypair = anchor.web3.Keypair.generate();

  const TOTAL_TOKENS = new anchor.BN(100_000_000);
  const BUCKETS = 100;
  const TOKENS_PER_BUCKET = new anchor.BN(1_000_000);
  const INITIAL_TOKENS_PER_SOL = new anchor.BN(541_125);
  const FINAL_TOKENS_PER_SOL = new anchor.BN(270_562);

  it("Initializes the auction", async () => {
    await program.methods
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

    const auction = await program.account.auction.fetch(
      auctionKeypair.publicKey
    );
    expect(auction.totalTokens.toString()).to.equal(TOTAL_TOKENS.toString());
    expect(auction.isActive).to.be.true;
  });

  it("Allows a user to purchase tokens", async () => {
    const user = anchor.web3.Keypair.generate();

    // Airdrop SOL to the user
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Calculate PDA for user record
    const [userRecordPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_record"),
        auctionKeypair.publicKey.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Purchase tokens
    const amountSol = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .purchase(amountSol)
      .accountsStrict({
        auction: auctionKeypair.publicKey,
        userRecord: userRecordPDA,
        user: user.publicKey,
        auctionWallet: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Verify purchase
    const userRecord = await program.account.userRecord.fetch(userRecordPDA);
    expect(userRecord.tokensPurchased.toString()).to.not.equal("0");

    // Check auction state
    const auction = await program.account.auction.fetch(
      auctionKeypair.publicKey
    );
    expect(auction.tokensSold.toString()).to.not.equal("0");
  });
});
