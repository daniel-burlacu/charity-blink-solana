import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CharityContract } from "../target/types/charity_contract";
import { assert } from "chai";

describe("charity_contract", () => {
  const connection = new anchor.web3.Connection("http://127.0.0.1:8898", "confirmed");
  
  const wallet = anchor.AnchorProvider.local().wallet;
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = anchor.workspace.CharityContract as Program<CharityContract>;

  let charityAccount: anchor.web3.Keypair;

  // async function fundAccount(account: anchor.web3.Keypair, space: number) {
  //   const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);
  //   const transaction = new anchor.web3.Transaction().add(
  //     anchor.web3.SystemProgram.createAccount({
  //       fromPubkey: provider.wallet.publicKey,
  //       newAccountPubkey: account.publicKey,
  //       lamports: lamports + 10000000, // Extra for transaction fees
  //       space,
  //       programId: program.programId,
  //     })
  //   );
  //   await provider.sendAndConfirm(transaction, [account]);
  // }

  beforeEach(async () => {
    charityAccount = anchor.web3.Keypair.generate(); // New charity account for each test
    const charitySpace = 56; // 8 (discriminator) + 32 (wallet) + 8 (u64) + 8 (i64)
//    await fundAccount(charityAccount, charitySpace); // Fund the new charity account
  });

  it("Initializes the charity account", async () => {
    const dueDate = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now

    // Initialize charity account
    try {
      await program.methods
        .initializeCharity(dueDate)
        .accounts({
          charity: charityAccount.publicKey,
          user: provider.wallet.publicKey,
        })
        .signers([charityAccount])
        .rpc();

      console.log("Charity account initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize charity account:", error);
      throw error;
    }

    // Fetch and verify the charity account
    const charity = await program.account.charity.fetch(charityAccount.publicKey);
    assert.equal(charity.totalDonations.toNumber(), 0, "Total donations should be 0");
    assert.ok(
      charity.dogPoundWallet.equals(new anchor.web3.PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G")),
      "Dog Pound Wallet mismatch"
    );
    assert.equal(charity.dueDate.toNumber(), dueDate.toNumber(), "Due date mismatch");
  });

it("Fails to re-initialize the charity account", async () => {
    try {
      const dueDate = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      // Attempt to call the initialize_charity function again (should fail)
      await program.methods
        .initializeCharity(dueDate)
        .accounts({
          charity: charityAccount.publicKey,
          user: provider.wallet.publicKey,
        })
        .signers([charityAccount])
        .rpc();
      assert.fail("Re-initialization should fail, but it succeeded");
    } catch (error) {
      // Check that the error is the expected one
      assert.equal(error.code, 6000); // Custom error for "Charity already initialized"
    }
  });

  it("Donates to the charity account", async () => {
    const initialDonation = 100; // Replace 100 with the desired initial donation amount
    await program.methods
      .donate(new anchor.BN(initialDonation))
      .accounts({
        charity: charityAccount.publicKey,
        donor: provider.wallet.publicKey, // Assuming the provider is the donor in this test case
      })
      .signers([])
      .rpc();
  
    const charity = await program.account.charity.fetch(charityAccount.publicKey);
    assert.equal(charity.totalDonations.toNumber(), initialDonation);
  });

  it("Retrieves charity information", async () => {
    // Fetch the charity account using the fetch method
    const charity = await program.account.charity.fetch(charityAccount.publicKey);
  
    // Declare the dueDate variable
    const dueDate = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);
  
    // Declare the initialDonation variable
    const initialDonation = 100; // Replace 100 with the desired initial donation amount
  
    // Validate the fields within the charity account
    assert.equal(charity.totalDonations.toNumber(), initialDonation); // Check total donations
    assert.ok(charity.dogPoundWallet.equals(new anchor.web3.PublicKey("BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G"))); // Check dog pound wallet
    assert.equal(charity.dueDate.toNumber(), dueDate.toNumber()); // Check due date
  });

  it("Fails to transfer funds before due date", async () => {
    const charity = await program.account.charity.fetch(charityAccount.publicKey);
    const currentTime = new anchor.BN(Math.floor(Date.now() / 1000)); // Current timestamp

    try {
      await program.methods
        .checkTimeAndTransfer(currentTime)
        .accounts({
          charity: charityAccount.publicKey,
          dogPoundWallet: charity.dogPoundWallet,
        })
        .signers([])
        .rpc();
      assert.fail("Transfer succeeded, but it should have failed due to being before the due date");
    } catch (error) {
      assert.equal(error.code, 6001); // Custom error for "Not Due Date"
    }
  });

   it("Transfers funds after due date", async () => {
    const charity = await program.account.charity.fetch(charityAccount.publicKey);
    const currentTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86401); // Simulate passing the due date

    await program.methods
      .checkTimeAndTransfer(currentTime)
      .accounts({
        charity: charityAccount.publicKey,
        dogPoundWallet: charity.dogPoundWallet,
      })
      .signers([])
      .rpc();

    const updatedCharity = await program.account.charity.fetch(charityAccount.publicKey);
    assert.equal(updatedCharity.totalDonations.toNumber(), 0); // Donations should be reset to 0 after transfer
  });
});
