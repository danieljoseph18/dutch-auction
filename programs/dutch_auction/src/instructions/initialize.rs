use crate::state::Auction;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + Auction::SIZE)]
    pub auction: Account<'info, Auction>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    total_tokens: u64,
    buckets: u8,
    tokens_per_bucket: u64,
    initial_tokens_per_sol: u64,
    final_tokens_per_sol: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    auction.authority = ctx.accounts.authority.key();
    auction.total_tokens = total_tokens;
    auction.buckets = buckets;
    auction.tokens_per_bucket = tokens_per_bucket;
    auction.initial_tokens_per_sol = initial_tokens_per_sol;
    auction.final_tokens_per_sol = final_tokens_per_sol;
    auction.current_bucket = 0;
    auction.tokens_sold = 0;
    auction.is_active = true;

    Ok(())
}
