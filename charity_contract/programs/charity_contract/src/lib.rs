use anchor_lang::prelude::*;
use std::str::FromStr;

declare_id!("9kqZ3ma4VY6Kmj7vgb1qPiLDoxb46zM5eEm1rsQZTG9L");

#[program]
pub mod charity_contract {
    use super::*;

    // Initialize the charity account with the dog pound wallet and due date
    // This function can only be called once (if the charity has been initialized, it will return an error)
    pub fn initialize_charity(ctx: Context<InitializeCharity>, due_date: i64) -> Result<()> {
        let charity = &mut ctx.accounts.charity;

        // Check if the charity account is already initialized
        if charity.dog_pound_wallet != Pubkey::default() {
            return Err(ProgramError::Custom(1).into());  // Custom error: Charity already initialized
        }

        charity.dog_pound_wallet = Pubkey::from_str("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G").unwrap();
        charity.total_donations = 0;
        charity.due_date = due_date;

        Ok(())
    }

    // Donation function, allowing users to donate funds
    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        charity.total_donations += amount;
        Ok(())
    }

    // Check if the due date has passed and transfer funds
    pub fn check_time_and_transfer(ctx: Context<CheckTimeAndTransfer>, current_timestamp: i64) -> Result<()> {
        let charity = &mut ctx.accounts.charity;

        if current_timestamp >= charity.due_date {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &charity.to_account_info().key,
                &charity.dog_pound_wallet.key(),
                charity.total_donations,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    charity.to_account_info(),
                    ctx.accounts.dog_pound_wallet.to_account_info(),
                ],
            )?;
            charity.total_donations = 0; // Reset after transfer
        } else {
            return Err(ProgramError::Custom(0).into()); // Custom error: Not Due Date
        }

        Ok(())
    }

    // New function to retrieve Charity information
    pub fn get_charity_info(ctx: Context<GetCharityInfo>) -> Result<(Pubkey, u64, i64)> {
        let charity = &ctx.accounts.charity;
        Ok((
            charity.dog_pound_wallet,   // Return the dog pound wallet
            charity.total_donations,    // Return total donations
            charity.due_date            // Return due date
        ))
    }
}

// Account structure for Charity
#[account]
pub struct Charity {
    pub dog_pound_wallet: Pubkey,  // Dog pound's wallet
    pub total_donations: u64,      // Track total donations
    pub due_date: i64,             // Unix timestamp for the due date
}

// Define the context for initializing the charity
#[derive(Accounts)]
pub struct InitializeCharity<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 8)]  // Space for the Charity account
    pub charity: Account<'info, Charity>,
    #[account(mut)]
    pub user: Signer<'info>,
     /// CHECK: System program, provided automatically by Anchor.
    pub system_program: Program<'info, System>,
}

// Define the context for the `donate` function
#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub charity: Account<'info, Charity>,  // Charity account
    #[account(signer)]  // Signer who is making the donation
    pub donor: Signer<'info>,
     /// CHECK: System program, provided automatically by Anchor.
    pub system_program: Program<'info, System>,  // System program for Solana
}

// Define the context for `check_time_and_transfer`
#[derive(Accounts)]
pub struct CheckTimeAndTransfer<'info> {
    #[account(mut)]
    pub charity: Account<'info, Charity>,  // Charity account

    /// CHECK: This is a simple transfer to an external wallet. No other validation is needed.
    #[account(mut)]
    pub dog_pound_wallet: AccountInfo<'info>,  // Dog pound wallet
    // CHECK: System program, provided automatically by Anchor.
    pub system_program: Program<'info, System>,   // System program for Solana
}

// Define the context for the `get_charity_info` function
#[derive(Accounts)]
pub struct GetCharityInfo<'info> {
    pub charity: Account<'info, Charity>,  // Charity account to fetch data from
}
