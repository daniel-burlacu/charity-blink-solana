import React from 'react'

import { ActionGetResponse , ActionPostResponse, ActionGetRequest, ACTIONS_CORS_HEADERS, MEMO_PROGRAM_ID, ActionPostRequest, createPostResponse } from '@solana/actions';
import { clusterApiUrl, ComputeBudgetProgram, Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

export function GET(req: Request) { 
    const metadata = {
      title: 'Charity Donation',
      lable: 'Donate to Charity',
      description: 'Donate to the charity or check if the due date has passed to transfer funds.',
      icon: new URL('https://img.freepik.com/free-psd/poster-with-pet-adoption-design_23-2148561733.jpg?w=826&t=st=1725956481~exp=1725957081~hmac=69dcc6de19cea3ad2d3e80bcabdbfc5eff8d3e518c36085846ee73c8a9fc6200'),
      tags: ['blockchain', 'cryptocurrency', 'decentralized'],
      availableActions: [
        {
          name: 'Donate',
          method: 'POST',
          endpoint: '/donate',
          description: 'Donate lamports to the charity',
        },
        {
          name: 'Check and Transfer',
          method: 'POST',
          endpoint: '/check-and-transfer',
          description: 'Transfer funds to the dog pound wallet if the due date has passed.',
        },
      ],
    };
    return Response.json(metadata, {
        headers: ACTIONS_CORS_HEADERS
    });
}
export const OPTIONS=GET;

export async function POST(req: Request) {
    //note : `createPostResponse` requires at least 1 non-memo instruction
    ComputeBudgetProgram.setComputeUnitPrice({
        microLamports:1,
    })
    try{
        const body:ActionPostRequest = await req.json();

        let account: PublicKey;
        try{
            account = new PublicKey(body.account);
        }catch(error){
            return new Response('Invalid "account provided',{ 
                status:400,
                headers: ACTIONS_CORS_HEADERS
            }), {
        }};

        const transaction = new Transaction();
        transaction.add(new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_ID),
            data: Buffer.from('This is a simple memo message!','utf-8'),
        }));
        transaction.feePayer = account;

        const connection = new Connection(clusterApiUrl('devnet'));
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction,
            }
            //signers: [account],
        })

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        });
    }catch(error){
        return Response.json("An unknown error occured, status :400 - "+{error: error}), {
    }
};
};