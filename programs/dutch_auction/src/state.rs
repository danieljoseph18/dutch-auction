use anchor_lang::prelude::*;

#[account]
pub struct Auction {
    pub authority: Pubkey,
    pub total_tokens: u64,
    pub buckets: u8,
    pub tokens_per_bucket: u64,
    pub initial_tokens_per_sol: u64,
    pub final_tokens_per_sol: u64,
    pub current_bucket: u8,
    pub tokens_sold: u64,
    pub is_active: bool,
}

impl Auction {
    pub const SIZE: usize = 32 + 8 + 1 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct UserRecord {
    pub tokens_purchased: u64,
    pub avg_price_per_token: u64,
}

impl UserRecord {
    pub const SIZE: usize = 8 + 8;
}