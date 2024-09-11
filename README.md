# 🐾 charity-blink-solana 🐾

### Logic: 

### Program:
* 📝 **Initialize**: A Solana program is set up once by setting a **due date** for the charity. This is a **one-time function**—once initialized, it’s done!
* 🛑 **Immutable Settings**: After initialization, the due date and charity wallet **cannot be changed**.
* 💰 **Donate Function**: Users can donate **SOL** or **lamports** (likely lamports for precision) to the program wallet.
* ⏳ **Check Time & Transfer**: Anyone can call this function to check if the **due date** has been reached. If so, all the funds are **transferred to the charity wallet**, and the donate function is closed. 
  * ⚠️ **Important**: Prevent reentrancy attacks! Make sure `check_time_and_transfer` cannot be called **multiple times** or **after funds** have been transferred.
* 📊 **Charity Info**: A function that returns the **charity wallet address**, total **donations** received, and the **due date**.

---

### Actions:
* 🌐 The **API server** acts as a backend interface, connecting the Solana program and the **Blink** (possibly a frontend widget or notification mechanism).
* 🔗 The API will connect to the Solana blockchain using a **Solana RPC client** or **web3.js**.
* 📤 The API will call the **donate function** in the Solana program, passing parameters like the donation amount in **lamports** and the user's account details.

---

### Blink:
* 🚀 **Trigger User Actions**: Blink handles user actions (like the **Donate** button in the frontend).
* 📡 **Connect to API**: It passes metadata (user details, donation amount, charity info) to the API server.
* 💬 **User Feedback**: Displays confirmation if the donation is **successful** or **failed**.
* 🐦 **X Integration**: Uses X's script to embed a **Blink** with relevant tweets or updates from your campaign.
