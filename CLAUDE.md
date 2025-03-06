# Dutch Auction Program Development Guide

## Build & Test Commands
- Build: `anchor build`
- Test all: `anchor test`
- Run single test: `yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/dutch_auction.ts`
- Lint: `yarn lint`
- Fix lint issues: `yarn lint:fix`
- Deploy: `anchor deploy`

## Code Style Guidelines

### TypeScript
- Use TypeScript for frontend and tests
- Follow Prettier formatting rules
- Import structure: external libraries first, then internal modules
- Error handling: use try/catch with proper logging

### Rust
- Follow standard Rust conventions for the Solana program
- Use the module structure in `instructions/` for program functionality
- Function naming: snake_case for Rust, camelCase for TypeScript 
- Error handling: use Result<T> with proper error types
- Document public functions and complex logic

### Anchor Specific
- Use Anchor's validation features for account validation
- Define clear account structures with proper constraints
- Keep instruction logic in separate modules
- Use proper error handling with custom error types