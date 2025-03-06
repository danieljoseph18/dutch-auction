use crate::errors::ErrorCode;
use crate::instructions::helpers::calculate_purchase;
use crate::state::{Auction, UserRecord};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserRecord::SIZE,
        seeds = [b"user_record", auction.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_record: Account<'info, UserRecord>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the wallet that receives SOL
    #[account(mut, constraint = auction_wallet.key() == auction.authority)]
    pub auction_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Process a purchase
pub fn purchase(ctx: Context<Purchase>, amount_sol: u64) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let user_record = &mut ctx.accounts.user_record;

    // Ensure auction is active
    require!(auction.is_active, ErrorCode::AuctionNotActive);

    // Calculate tokens to purchase and SOL required
    let (tokens_to_purchase, sol_required) = calculate_purchase(auction, amount_sol)?;

    // Ensure user sent enough SOL
    require!(
        ctx.accounts.user.lamports() >= sol_required,
        ErrorCode::InsufficientFunds
    );

    // Transfer SOL from user to auction authority using system program
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.auction_wallet.to_account_info(),
            },
        ),
        sol_required,
    )?;

    // Update user record with weighted average price
    let old_total = user_record.tokens_purchased;
    let old_avg_price = user_record.avg_price_per_token;

    user_record.tokens_purchased += tokens_to_purchase;

    // Calculate new weighted average price (in lamports per token)
    let new_avg_price = if old_total == 0 {
        sol_required * 1_000_000_000 / tokens_to_purchase // Convert to lamports
    } else {
        (((old_total as u128 * old_avg_price as u128)
            + (tokens_to_purchase as u128
                * (sol_required * 1_000_000_000 / tokens_to_purchase) as u128))
            / (old_total + tokens_to_purchase) as u128) as u64
    };

    user_record.avg_price_per_token = new_avg_price;

    // Update auction state
    auction.tokens_sold += tokens_to_purchase;

    // Update current bucket if needed
    let tokens_sold_in_buckets = auction.tokens_sold / auction.tokens_per_bucket;
    if tokens_sold_in_buckets >= auction.current_bucket as u64 {
        auction.current_bucket = tokens_sold_in_buckets as u8;
    }

    // Check if auction is complete
    if auction.tokens_sold >= auction.total_tokens {
        auction.is_active = false;
    }

    Ok(())
}
