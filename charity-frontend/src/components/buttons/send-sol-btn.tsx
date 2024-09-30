// src/buttons/SendSolButton.tsx
import { useState } from 'react';
import { VStack, Button, Input, useToast, Text } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import MotionBox from '../utils/MotionBox';  // Import the custom MotionBox component

interface SendSolButtonProps {
  onSendSuccess: () => void;
}

export function SendSolButton({ onSendSuccess }: SendSolButtonProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  const handleSendSol = async () => {
    if (!publicKey || !recipientAddress || !amount) {
      toast({
        title: "Invalid input",
        description: "Please ensure all fields are filled correctly.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSending(true);

      const recipientPublicKey = new PublicKey(recipientAddress);
      const lamports = parseFloat(amount) * 10 ** 9; // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPublicKey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Transaction Successful",
        description: `Sent ${amount} SOL to ${recipientAddress}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Call the success callback to update the balance
      onSendSuccess();

      setRecipientAddress('');
      setAmount('');
    } catch (error) {
      console.error("Transaction failed:", error);
      toast({
        title: "Transaction Failed",
        description: "There was an issue with the transaction.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="lg"
      w="full"
      maxW="md"
    >
      <VStack spacing={4}>
        <Input
          placeholder="Recipient Wallet Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          isDisabled={isSending}
        />
        <Input
          placeholder="Amount (SOL)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          isDisabled={isSending}
        />
        <Button
          colorScheme="primary"
          onClick={handleSendSol}
          isLoading={isSending}
          loadingText="Sending"
          isDisabled={!publicKey || isSending}
          _disabled={{ cursor: 'not-allowed', opacity: 0.6 }}
        >
          Send SOL
        </Button>
        {isSending && <Text fontSize="sm" color="gray.500">Processing transaction...</Text>}
      </VStack>
    </MotionBox>
  );
}
