use crate::errors::ErrorCode;
use crate::state::Auction;
use anchor_lang::prelude::*;

// Calculate tokens per SOL for a specific bucket
pub fn calculate_bucket_rate(
    initial_rate: u64,
    _final_rate: u64,
    bucket: u8,
    total_buckets: u8,
) -> u64 {
    // Using the formula: R_k = initial_rate * (1 / (1 + k/99))
    // Simplified for integer arithmetic
    let numerator = initial_rate as u128 * (total_buckets as u128);
    let denominator = (total_buckets as u128) + (bucket as u128);
    (numerator / denominator) as u64
}

// Helper function to calculate tokens and SOL for a purchase
pub fn calculate_purchase(auction: &Account<Auction>, amount_sol: u64) -> Result<(u64, u64)> {
    let mut tokens_remaining = auction.total_tokens - auction.tokens_sold;
    let mut current_bucket = auction.current_bucket;
    let mut tokens_to_purchase = 0;
    let mut sol_required = 0;

    let mut sol_remaining = amount_sol;

    while sol_remaining > 0 && tokens_remaining > 0 && current_bucket < auction.buckets {
        // Calculate tokens per SOL for current bucket
        let tokens_per_sol = calculate_bucket_rate(
            auction.initial_tokens_per_sol,
            auction.final_tokens_per_sol,
            current_bucket,
            auction.buckets,
        );

        // Calculate tokens left in current bucket
        let tokens_in_bucket = auction.tokens_per_bucket;
        let tokens_sold_in_bucket = if current_bucket == auction.current_bucket {
            auction.tokens_sold % auction.tokens_per_bucket
        } else {
            0
        };
        let tokens_left_in_bucket = tokens_in_bucket - tokens_sold_in_bucket;

        // Calculate how many tokens can be purchased with remaining SOL
        let sol_for_bucket =
            (tokens_left_in_bucket as u128 * 1_000_000_000 / tokens_per_sol as u128) as u64;

        if sol_remaining >= sol_for_bucket {
            // Can purchase all tokens in this bucket
            tokens_to_purchase += tokens_left_in_bucket;
            sol_required += sol_for_bucket;
            sol_remaining -= sol_for_bucket;
            tokens_remaining -= tokens_left_in_bucket;
            current_bucket += 1;
        } else {
            // Can purchase partial tokens in this bucket
            let tokens_purchasable =
                (sol_remaining as u128 * tokens_per_sol as u128 / 1_000_000_000) as u64;
            tokens_to_purchase += tokens_purchasable;
            sol_required += sol_remaining;
            tokens_remaining -= tokens_purchasable;
            sol_remaining = 0;
        }
    }

    require!(tokens_to_purchase > 0, ErrorCode::ZeroPurchase);

    Ok((tokens_to_purchase, sol_required))
}
