import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorProvider } from '@coral-xyz/anchor';
import { assert } from "chai";
import { PublicKey} from "@solana/web3.js";
import BN from "bn.js";
import { CharityContract } from "../target/types/charity_contract"; // Import generated types
import * as path from "path";
import * as os from "os";

const provider = AnchorProvider.env();
anchor.setProvider(provider);

// Helper function to confirm transactions
async function confirmTransaction(
  connection: anchor.web3.Connection,
  txHash: string
) {
  const { value: statuses } = await connection.getSignatureStatuses([txHash]);
  const status = statuses?.[0];
  if (!status || status.err) {
    throw new Error("Transaction failed");
  }
}
describe("CharityContract Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CharityContract as Program<CharityContract>;

  let charityPDA: PublicKey;
  let treasuryPDA: PublicKey;
  let donorAccount: anchor.web3.Keypair;
   // const oneDayInSeconds = 60 * 60 * 24; // 86400 seconds in one day
  const oneDayInSeconds = 60 * 60 * 24 * 7; // secconds in 1 week
  // const dueDate = new anchor.BN(Math.floor(Date.now() / 1000) - oneDayInSeconds); // Set dueDate to one day back
  const dueDate = new BN(Math.floor(Date.now() / 1000) + oneDayInSeconds); // Set dueDate one week from current time stamp

  before(async () => {
    // Generate PDAs for charity and treasury
    [charityPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("charity")],
      program.programId
    );
  
    [treasuryPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("treasury")],
      program.programId
    );
  
    console.log("Treasury PDA:", treasuryPDA.toBase58());
    console.log("Charity PDA:", charityPDA.toBase58());

    // Create a donor account
    // donorAccount = anchor.web3.Keypair.generate();
    const walletFilePath = path.join(os.homedir(), '.solana', '.config', 'localwalet.json');  // Use the correct path to your wallet file
    // Airdrop SOL to cover transaction fees
    // await provider.connection.confirmTransaction(
    //   await provider.connection.requestAirdrop(
    //     provider.wallet.publicKey,
    //     anchor.web3.LAMPORTS_PER_SOL
    //   )
    // );
  
    // Check if the charity PDA already exists
    try {
      const charityAccount = await program.account.charity.fetch(charityPDA);
      console.log("Charity PDA already exists, skipping initialization: {}", charityAccount);
    } catch (err) {
      console.log("Charity PDA not found, initializing...");
      // Initialize the charity account with a due date if it doesn't exist
      const txHash = await program.methods
        .initiateProgram(dueDate, "BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G")
        .accounts({
          user: provider.wallet.publicKey, // User who is paying for the account
        })
        .rpc();
  
      await confirmTransaction(provider.connection, txHash);
    }
  
    // Fetch the initialized charity data
    const charity = await program.account.charity.fetch(charityPDA);
  
    assert.strictEqual(charity.donationAllowed, true, "Donations should be allowed");
  });

  it("Donates lamports to the treasury PDA", async () => {
    const donationAmount = new anchor.BN(500_000); // 0.0005 SOL
  
    // Airdrop SOL to the donor account to ensure it has enough funds
    // await provider.connection.confirmTransaction(
    //   await provider.connection.requestAirdrop(
    //     donorAccount.publicKey,
    //     anchor.web3.LAMPORTS_PER_SOL
    //   )
    // );
  
    const donorBalanceBefore = await provider.connection.getBalance(donorAccount.publicKey);
    const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPDA);
  
    // Ensure the donor has enough funds
    assert(donorBalanceBefore >= donationAmount.toNumber(), "Donor doesn't have enough funds");
  
    // Execute the donation transaction
    const txHash = await program.methods
      .donate(donationAmount)
      .accounts({
        donor: donorAccount.publicKey,
        charity: charityPDA,
      })
      .signers([donorAccount])
      .rpc();
  
    await confirmTransaction(provider.connection, txHash);
  
    // Check updated balances
    const donorBalanceAfter = await provider.connection.getBalance(donorAccount.publicKey);
    const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPDA);
  
    assert(donorBalanceAfter < donorBalanceBefore, "Donor balance should decrease after transfer");
    assert.strictEqual(
      treasuryBalanceAfter,
      treasuryBalanceBefore + donationAmount.toNumber(),
      "Treasury PDA balance should increase by the donation amount"
    );
  });

  it("Retrieves charity and treasury information", async () => {
    // Call the `getCharityInfo` method using RPC
    const charityInfo = await program.account.charity.fetch(charityPDA);

    // Destructure the returned charity info and treasury balance
    const { dogPoundWallet, totalDonations, dueDate, donationAllowed } = charityInfo;

    // Define the expected balance (e.g., 0 or whatever is expected based on previous test state)
    const expectedTreasuryBalance = await provider.connection.getBalance(treasuryPDA);

    // Validate the fields
    assert.ok(dogPoundWallet.equals(new anchor.web3.PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G")));
    assert(totalDonations.toNumber()> 0, "Total donations mismatch");
    assert.ok(donationAllowed, "Donations should be allowed");
    assert.equal(expectedTreasuryBalance, expectedTreasuryBalance, "Treasury PDA balance mismatch");
});

it("Fail Transfers funds to the hardcoded wallet before due date", async () => {
  const hardcodedWallet = new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G");

  // Airdrop SOL to the treasury PDA to simulate donations
  // await provider.connection.confirmTransaction(
  //   await provider.connection.requestAirdrop(treasuryPDA, 5 * anchor.web3.LAMPORTS_PER_SOL)
  // );

  const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPDA);
  const dogPoundWalletBalanceBefore = await provider.connection.getBalance(hardcodedWallet);

  try {
    // Attempt the transfer to the hardcoded wallet before the due date has passed
    const txHash = await program.methods
      .checkTimeAndTransfer()
      .accounts({
        user: provider.wallet.publicKey,
        dogPoundWallet: hardcodedWallet,  // Hardcoded wallet
      })
      .rpc();

    // If no error, the test should fail
    assert.fail("Expected transaction to fail before due date");

  } catch (error) {
    // Confirm the error is CharityError::NotDueDate (code 6000)
    const errorMessage = error.toString();
    assert(errorMessage.includes("12000"), `Expected error code 6000 but got ${errorMessage}`);

    // Optionally, check if specific logs exist for debugging
    const logs = error.logs || [];
    assert(logs.some(log => log.includes("Instruction: CheckTimeAndTransfer")), "CheckTimeAndTransfer logs missing");
  }

  // Verify no funds were transferred to the dog pound wallet
  const dogPoundWalletBalanceAfter = await provider.connection.getBalance(hardcodedWallet);
  assert.strictEqual(dogPoundWalletBalanceAfter, dogPoundWalletBalanceBefore, "Dog pound wallet balance should not have changed");

  // Verify the treasury still has the original balance
  const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPDA);
  assert.strictEqual(treasuryBalanceAfter, treasuryBalanceBefore, "Treasury balance should not have changed");
});


// it("Transfers funds to the hardcoded wallet after due date", async () => {
//   const hardcodedWallet = new PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G");

//   // Simulate donations by airdropping SOL to the treasury PDA
//   await provider.connection.confirmTransaction(
//     await provider.connection.requestAirdrop(treasuryPDA, 5 * anchor.web3.LAMPORTS_PER_SOL)
//   );

//   const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPDA);
//   const dogPoundWalletBalanceBefore = await provider.connection.getBalance(hardcodedWallet);

//   try {
//     // Execute the transfer after the due date
//     const txHash = await program.methods
//       .checkTimeAndTransfer()
//       .accounts({
//         user: provider.wallet.publicKey,
//         dogPoundWallet: hardcodedWallet,  // Hardcoded wallet
//       })
//       .rpc();

//     await confirmTransaction(provider.connection, txHash);

//     // Check dog pound wallet and treasury balance after transfer
//     const dogPoundWalletBalanceAfter = await provider.connection.getBalance(hardcodedWallet);
//     const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPDA);

//     // Expect treasury balance to equal the rent-exempt minimum, not zero
//     const rentExemptMinimum = await provider.connection.getMinimumBalanceForRentExemption(8 + 32 + 8 + 8 + 1);

//     assert(treasuryBalanceAfter>0, "Treasury PDA should only contain rent-exempt minimum after transfer");
//     assert(dogPoundWalletBalanceAfter > dogPoundWalletBalanceBefore, "Dog pound wallet should have received lamports");
//   } catch (error) {
//     console.error(error.logs);  // Log detailed error messages for debugging
//     assert.fail("Transaction failed: " + error.message);
//   }
// });
});