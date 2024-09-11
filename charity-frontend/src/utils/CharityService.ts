import { AnchorProvider, Idl, Program, web3 } from '@coral-xyz/anchor';
import {  PublicKey, Transaction} from '@solana/web3.js';
import  idl  from '../../../charity_contract/target/idl/charity_contract.json';
import BN from 'bn.js'; // Replace BN import with this

// const programID = new PublicKey('4RkMT6uz7bu72NSnaYJAKibuagqJeGwr3Qb9iroVCvWu');

export const initializeCharity = async (
  provider: AnchorProvider,
  dueDate: number
) => {
  const program = new Program(idl as Idl, provider);

  const charityAccount = web3.Keypair.generate();

  await program.rpc.initializeCharity(dueDate, {
    accounts: {
      charity: charityAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    },
    signers: [charityAccount],
  });
  return charityAccount;
};

export const donate = async (
  provider: AnchorProvider,
  charityPubkey: PublicKey,
  amount: number
): Promise<Transaction> => {
  const program = new Program(idl as any, provider);
  console.log("Donating", amount, "to charity", charityPubkey.toBase58()); // Add logging

  const transaction = new web3.Transaction().add(
    program.instruction.donate(new BN(amount), {
      accounts: {
        charity: charityPubkey,
        donor: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      },
    })
  );

  console.log("Transaction created:", transaction); // Add logging
  return transaction; // Return the transaction so it can be sent
};


export const checkTimeAndTransfer = async (provider: AnchorProvider, charityPubkey: PublicKey, currentTime: number) => {
  const program = new Program(idl as Idl, provider);

  await program.rpc.checkTimeAndTransfer(new BN(currentTime), {
    accounts: {
      charity: charityPubkey,
      dogPoundWallet: charityPubkey, // assuming dog pound wallet account
      systemProgram: web3.SystemProgram.programId,
    },
  });
};
