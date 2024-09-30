use anchor_lang::prelude::*;
use std::str::FromStr;

declare_id!("EgzKcNUZuprRisKAh6SwLRj19rd7sncHWjHcLVC5ATn8");

#[program]
pub mod charity_contract {
    use super::*;

    // Function to initialize the charity program
    pub fn initiate_program(ctx: Context<InitiateProgram>, due_date: i64 , charity_wallet_address: String) -> Result<()> {
        let charity = &mut ctx.accounts.charity;

        if due_date == 0 {
            msg!("Due date does not exist, program is not initialized !");
            return Err(CharityError::InvalidWallet.into());
        }
         // Validate the charity wallet address
        if charity_wallet_address.is_empty() {
            msg!("Charity wallet address does not exist");
            return Err(CharityError::InvalidWallet.into());
        }
        
        // Hardcode the wallet
        // let hardcoded_wallet = Pubkey::from_str("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G")
        let charity_wallet_pubkey = Pubkey::from_str(&charity_wallet_address).map_err(|_| CharityError::InvalidWallet)?;
  
        charity.dog_pound_wallet = charity_wallet_pubkey;
        charity.total_donations = 0;
        charity.due_date = due_date;
        charity.donation_allowed = true;

        Ok(())
    }

    // Donation function, allows users to donate to the treasury PDA
    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let signer = &mut ctx.accounts.donor; // Donor who is signing this transaction
        let treasury_balance_before = ctx.accounts.treasury_pda.to_account_info().lamports();

        // Check if donations are allowed
        if !charity.donation_allowed {
            return Err(CharityError::DonationsNotAllowed.into());
        }

        // Ensure the current time is before the due date
        let clock = Clock::get()?;
        if clock.unix_timestamp >= charity.due_date {
            return Err(CharityError::DonationsNotAllowed.into());
        }

        // Transfer lamports to the treasury PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &signer.key(),
            &ctx.accounts.treasury_pda.to_account_info().key,
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                signer.to_account_info(),
                ctx.accounts.treasury_pda.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update total donations
        // Safely update total donations using `checked_add` to prevent overflow
        charity.total_donations = charity.total_donations.checked_add(amount).ok_or(CharityError::Overflow)?;

        // Ensure treasury balance has increased correctly
        let treasury_balance_after = ctx.accounts.treasury_pda.to_account_info().lamports();
        require_eq!(treasury_balance_after, treasury_balance_before + amount);

        Ok(())
    }

    pub fn check_time_and_transfer(ctx: Context<CheckTimeAndTransfer>) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
    
         // Fetch the current blockchain timestamp
         let clock = Clock::get()?; // Fetch the current on-chain time
         let current_timestamp = clock.unix_timestamp;
         msg!("Current blockchain timestamp: {}", current_timestamp);

        // Log the dog pound wallet balance before the transfer
        msg!("Dog pound wallet balance before transfer: {}", **ctx.accounts.dog_pound_wallet.to_account_info().lamports.borrow());
    
        if charity.donation_allowed == false {
            msg!("Program has not been initialized, call not allowed !");
            return Err(CharityError::DonationsNotAllowed.into());
        }

        // Ensure due date has passed
        if current_timestamp < charity.due_date {
            msg!("Not Due Date: {}", charity.due_date);
            return Err(CharityError::NotDueDate.into());
        }
    
        // Calculate transaction fees
        let transaction_fee_estimate: u64 = 5000;
        let fee_with_buffer: u64 = (transaction_fee_estimate as f64 * 1.005).round() as u64;
    
        // Get the treasury PDA balance before transfer
        let treasury_pda_lamports = **ctx.accounts.treasury_pda.to_account_info().try_borrow_mut_lamports()?;
        if treasury_pda_lamports <= fee_with_buffer {
            msg!("Calculation is wrong, fee_with_buffer is bigger than treasury_balance: {}", fee_with_buffer);
            return Err(CharityError::InsufficientFunds.into());
        }
    
        // Get the rent-exemption minimum required for the Treasury PDA
        let rent_exempt_minimum = Rent::get()?.minimum_balance(ctx.accounts.treasury_pda.to_account_info().data_len());
    
        // Calculate how much can be transferred without violating rent-exemption
        let max_transferable_amount = treasury_pda_lamports.checked_sub(rent_exempt_minimum)
            .ok_or(CharityError::InsufficientFunds)?;
    
        // Ensure the amount to transfer does not exceed the max transferable amount
        let amount_to_transfer = max_transferable_amount.checked_sub(fee_with_buffer)
            .ok_or(CharityError::InsufficientFunds)?;
    
        // Perform the transfer by adjusting balances safely
        **ctx.accounts.treasury_pda.to_account_info().try_borrow_mut_lamports()? = treasury_pda_lamports
            .checked_sub(amount_to_transfer)
            .ok_or(CharityError::InsufficientFunds)?;
    
        // Fetch dog pound wallet lamports
        let dog_pound_wallet_lamports = **ctx.accounts.dog_pound_wallet.to_account_info().try_borrow_mut_lamports()?;
    
        // Safely add the amount to the dog pound wallet
        **ctx.accounts.dog_pound_wallet.to_account_info().try_borrow_mut_lamports()? = dog_pound_wallet_lamports
            .checked_add(amount_to_transfer)
            .ok_or(CharityError::Overflow)?;
    
        // Log the balances after the transfer
        msg!("Dog pound wallet balance after transfer: {}", ctx.accounts.dog_pound_wallet.to_account_info().lamports());
        msg!("Treasury PDA balance after transfer: {}", ctx.accounts.treasury_pda.to_account_info().lamports());
    
        // Final check: ensure the treasury PDA has only the rent-exemption amount left
        let treasury_balance_after = ctx.accounts.treasury_pda.to_account_info().lamports();
        require!(
            treasury_balance_after >= rent_exempt_minimum,
            CharityError::InsufficientFunds
        );
    
        // Log the final balances for verification
        msg!("Treasury balance before transfer: {}", treasury_pda_lamports);
        msg!("Amount to transfer: {}", amount_to_transfer);
        msg!("Treasury balance after transfer: {}", treasury_balance_after);
    
        // Set donation_allowed to false after transfer
        charity.donation_allowed = false;
        charity.due_date = 0;
        Ok(())
    }
    
pub fn get_charity_info(ctx: Context<GetCharityInfo>) -> Result<(Pubkey, u64, i64, bool, u64)> {
    let charity = &ctx.accounts.charity;
    let treasury_pda_balance = ctx.accounts.treasury_pda.to_account_info().lamports();  // Get the balance of the treasury PDA
    
    // if charity.donation_allowed == false {
    //     msg!("Program has not been initialized, call not allowed !");
    //     return Err(CharityError::DonationsNotAllowed.into());
    // }

    Ok((
        charity.dog_pound_wallet,     // Return the dog pound wallet
        charity.total_donations,      // Return total donations
        charity.due_date,             // Return due date
        charity.donation_allowed,     // Return donation allowed flag
        treasury_pda_balance          // Return the balance of the treasury PDA
    ))
}

// Charity account structure
#[account]
pub struct Charity {
    pub dog_pound_wallet: Pubkey,
    pub total_donations: u64,
    pub due_date: i64,
    pub donation_allowed: bool,
}

// Initialize Program Context
#[derive(Accounts)]
pub struct InitiateProgram<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 8 + 1, seeds = [b"charity".as_ref()], bump)]
    pub charity: Account<'info, Charity>,

    #[account(init, payer = user, seeds = [b"treasury".as_ref()], bump, space = 8)]
    /// CHECK: This is the treasury PDA controlled by the program, it receives donations
    pub treasury_pda: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,// The user who is funding the initialization

    pub system_program: Program<'info, System>,// Solana's system program
}

// Context definition for fetching charity and treasury PDA info
#[derive(Accounts)]
pub struct GetCharityInfo<'info> {
    #[account(seeds = [b"charity".as_ref()], bump)]
    pub charity: Account<'info, Charity>,  // Charity account storing metadata

    #[account(seeds = [b"treasury".as_ref()], bump)]
    /// CHECK: Treasury PDA controlled by the program
    pub treasury_pda: AccountInfo<'info>,  // Treasury PDA where donations are stored
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]  // Charity account needs to be mutable to update donations
    pub charity: Account<'info, Charity>,  // Charity account where donations will go

    /// CHECK: This is the treasury PDA controlled by the program, it receives donations
    #[account(mut, seeds = [b"treasury".as_ref()], bump)]  // Treasury PDA to receive lamports
    pub treasury_pda: AccountInfo<'info>,  // Treasury PDA to hold donated lamports

    #[account(mut, signer)]  // Donor account, must sign the transaction
    pub donor: Signer<'info>,  // Donor's account (signer of the transaction)

    /// CHECK: This is safe because we are simply transferring SOL using the system program
    pub system_program: Program<'info, System>,  // System program for Solana
}

#[derive(Accounts)]
pub struct CheckTimeAndTransfer<'info> {
    
    #[account(mut, seeds = [b"charity".as_ref()], bump)] // Charity account must be mutable to update donations
    /// CHECK: This is a charity account PDA controlled by the program.
    pub charity: Account<'info, Charity>, // Charity account receiving donations

    #[account(mut, seeds = [b"treasury".as_ref()], bump)]
    /// CHECK: This is a PDA for holding donations, and we're only transferring lamports
    pub treasury_pda: AccountInfo<'info>, // Treasury PDA for donations


    /// CHECK: This is an external wallet (dog pound wallet) to which we will transfer lamports.
    /// No further checks are necessary because we are only transferring lamports to this account.
    #[account(mut)]
    pub dog_pound_wallet: AccountInfo<'info>, // External wallet

    #[account(signer)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum CharityError {
    #[msg("Not Due Date")]
    NotDueDate = 6000,
    #[msg("Charity already initialized")]
    CharityAlreadyInitialized = 6001,
    #[msg("Donations not allowed")]
    DonationsNotAllowed = 6002,
    #[msg("Insufficient funds")]
    InsufficientFunds = 6003,
    #[msg("Invalid wallet address")]
    InvalidWallet = 6004,
    #[msg("Overflow error")]
    Overflow = 6005,  // Define a custom overflow error
}
}
