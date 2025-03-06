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

This formula works so that each bucket has a progressively higher price.
​
