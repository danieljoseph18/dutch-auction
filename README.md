# SOLANA DUTCH AUCTION PROGRAM

This is a solana program (created using the Anchor framework) for creating dutch auction style token sales.

This specific implementation has 100 buckets, each with a different price. Each bucket contains 1/100x tokens, so if you want to auction off 1,000,000 tokens, each bucket will contain 10,000 for example.

The formula for the price of each bucket is as follows:

```
Rk = Rinit ​× (1 / ( 1 + (k / 99)))
```

Where:

- R = price
- k = current bucket
- init = initial (e.g Rinit = initial price)

This formula works so that each bucket has a progressively higher price. Price in this context is just the amount of tokens purchased per SOL commited.

SOL is transferred directly to the authority's wallet.

Users can commit across multiple buckets, in which case, their purchased tokens will be filled at different prices.

## Frontend Integration Guide

### Setting Up the Client

```typescript
import { Program } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from 'bn.js';
import { DutchAuction } from './idl/dutch_auction'; // Import your IDL

// Initialize connection and program
const connection = new Connection('...');
const program = new Program<DutchAuction>(IDL, PROGRAM_ID, provider);
```

### Calling the Purchase Function

To purchase tokens in the auction:

```typescript
async function purchaseTokens(
  auctionPublicKey: PublicKey,
  amountSol: number
) {
  // Calculate user record PDA
  const [userRecordPDA] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_record"),
      auctionPublicKey.toBuffer(),
      wallet.publicKey.toBuffer()
    ],
    program.programId
  );

  // Get the auction authority from the auction account
  const auction = await program.account.auction.fetch(auctionPublicKey);
  
  // Convert SOL to lamports
  const solAmount = new BN(amountSol * LAMPORTS_PER_SOL);

  // Send transaction
  await program.methods
    .purchase(solAmount)
    .accountsStrict({
      auction: auctionPublicKey,
      userRecord: userRecordPDA,
      user: wallet.publicKey,
      auctionWallet: auction.authority, // Authority wallet receives the SOL
      systemProgram: SystemProgram.programId
    })
    .rpc();
}
```

### Getting Current Auction State & Price

To fetch the current auction state and calculate tokens per SOL:

```typescript
async function getAuctionState(auctionPublicKey: PublicKey) {
  // Fetch the auction account
  const auction = await program.account.auction.fetch(auctionPublicKey);

  // Calculate current tokens per SOL based on the bucket formula
  const currentTokensPerSol = calculateBucketRate(
    auction.initialTokensPerSol,
    auction.currentBucket,
    auction.buckets
  );

  return {
    isActive: auction.isActive,
    currentBucket: auction.currentBucket,
    tokensSold: auction.tokensSold.toString(),
    totalTokens: auction.totalTokens.toString(),
    remainingTokens: auction.totalTokens.sub(auction.tokensSold).toString(),
    currentTokensPerSol: currentTokensPerSol.toString(),
    // For UI display - e.g. "Get 100 tokens per SOL at current price"
    displayRate: `${currentTokensPerSol.toString()} tokens per SOL`
  };
}

// Calculate the current bucket rate using the formula from the contract
function calculateBucketRate(
  initialRate: BN,
  bucket: number,
  totalBuckets: number = 100
) {
  // Using the formula: R_k = initial_rate * (1 / (1 + k/99))
  const numerator = initialRate.mul(new BN(totalBuckets - 1));
  const denominator = new BN(totalBuckets - 1 + bucket);
  return numerator.div(denominator);
}
```

### Getting Participant Information

To fetch information about a specific user's participation:

```typescript
async function getUserParticipation(
  auctionPublicKey: PublicKey,
  userPublicKey: PublicKey
) {
  // Calculate user record PDA
  const [userRecordPDA] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_record"),
      auctionPublicKey.toBuffer(),
      userPublicKey.toBuffer()
    ],
    program.programId
  );

  try {
    // Fetch the user record
    const userRecord = await program.account.userRecord.fetch(userRecordPDA);
    
    return {
      exists: true,
      tokensPurchased: userRecord.tokensPurchased.toString(),
      solCommitted: userRecord.solCommitted.toString(),
      // Convert to SOL for display
      solCommittedDisplay: `${userRecord.solCommitted.toNumber() / LAMPORTS_PER_SOL} SOL`
    };
  } catch (error) {
    // User hasn't participated yet
    return {
      exists: false,
      tokensPurchased: "0",
      solCommitted: "0",
      solCommittedDisplay: "0 SOL"
    };
  }
}
```

### Getting All Participants

To fetch a list of all participants in the auction:

```typescript
async function getAllParticipants(auctionPublicKey: PublicKey) {
  // Query all UserRecord accounts for this auction
  const userAccountPrefix = [Buffer.from("user_record"), auctionPublicKey.toBuffer()];
  
  // Fetch all user record accounts that match our filters
  const userAccounts = await program.account.userRecord.all([
    {
      memcmp: {
        offset: 8, // Skip the discriminator
        bytes: auctionPublicKey.toBase58()
      }
    }
  ]);
  
  // Map to a more usable format
  return userAccounts.map(account => {
    const data = account.account;
    return {
      publicKey: account.publicKey.toString(),
      owner: data.user.toString(),
      tokensPurchased: data.tokensPurchased.toString(),
      solCommitted: data.solCommitted.toString(),
      solCommittedDisplay: `${data.solCommitted.toNumber() / LAMPORTS_PER_SOL} SOL`
    };
  });
}
```

### Best Practices for the Frontend

1. **Real-time Updates**: Poll the auction state regularly (e.g., every 10 seconds) to show the current bucket and price.

2. **Transaction Feedback**: Provide clear feedback during the purchase process, including pending state and confirmation.

3. **Error Handling**: Handle common errors like:
   - `AuctionNotActive`: The auction has ended
   - `InsufficientFunds`: The user doesn't have enough SOL

4. **Purchase Estimation**: Calculate and display the estimated tokens a user will receive before they commit SOL.

5. **Bucket Visualization**: Show a visual representation of the buckets, highlighting the current one and indicating price changes.

6. **User Dashboard**: Create a dashboard showing the user's participation history, including tokens purchased and average price.
​
