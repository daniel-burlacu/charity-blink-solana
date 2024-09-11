# charity-blink-solana
Logic: 

Program:
* Solana program that get's initialized by setting an due date to the charity,it is an onetime function - once it is initialized it's done.
* After initialization, the due date and wallet are immutable (cannot be changed).
* It has a donate function where people can send sol or lamports(not decided yet - pobably lamports) to program wallet.
* Any one can call this function check_time_and_transfer - which will basicaly check if it is duedate, if so all the amount will be transfered to charity wallet and close the donate function.
  Consideration : (reentrancy attack) Make sure that the function check_time_and_transfer cannot be called repeatedly or after funds have been transferred to the charity.
* We can call the get_charity_info function which will basicaly return the charity wallet, total donation and the due_date.

Actions:
The API server acts as a backend interface to interact with the Solana program and the Blink (presumably some external entity, maybe a frontend widget or a notification mechanism).
The API will connect to the Solana blockchain using a Solana RPC client or web3.js
The API server will invoke the donate function in the Solana program, passing the necessary parameters (amount in lamports, user account, etc.).

Blink: 
Trigger user actions (e.g., donate button in the frontend).
Connect to the API server, passing necessary metadata (user details, donation amount, charity details).
Show feedback to the user (e.g., confirmation that the donation was successful or failed).
Using X script to have the embeded Blink


