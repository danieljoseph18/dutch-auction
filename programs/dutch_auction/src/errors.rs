use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Auction is not active")]
    AuctionNotActive,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Zero tokens purchased")]
    ZeroPurchase,
}