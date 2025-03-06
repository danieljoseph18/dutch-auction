use anchor_lang::prelude::*;
use instructions::*;

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("6hwrDgkzdyFTSBQZCYJX8nzQSYXUtcxvZtKoe6rDWbqi");

#[program]
pub mod dutch_auction {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        total_tokens: u64,
        buckets: u8,
        tokens_per_bucket: u64,
        initial_tokens_per_sol: u64,
        final_tokens_per_sol: u64,
    ) -> Result<()> {
        instructions::initialize::initialize(
            ctx,
            total_tokens,
            buckets,
            tokens_per_bucket,
            initial_tokens_per_sol,
            final_tokens_per_sol,
        )
    }

    pub fn purchase(ctx: Context<Purchase>, amount_sol: u64) -> Result<()> {
        instructions::purchase::purchase(ctx, amount_sol)
    }
}
