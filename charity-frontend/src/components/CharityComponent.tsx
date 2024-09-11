import { useWallet } from '@solana/wallet-adapter-react';
import { useState, forwardRef, useEffect } from 'react';
import { Flex, Box, Input, Text, Button, ButtonProps, VStack, Heading, useToast } from '@chakra-ui/react';
import { initializeCharity, donate } from '../utils/CharityService';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { motion } from 'framer-motion';

// Custom wallet interface for AnchorProvider
interface BrowserWallet {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  payer: PublicKey;
}

// MotionButton using Chakra UI's Button component wrapped in forwardRef
const MotionButton = motion(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <Button ref={ref} {...props} />
  ))
);

export const CharityComponent: React.FC = () => {
  const { publicKey, signTransaction, connected, sendTransaction } = useWallet();
  const toast = useToast(); // Chakra UI's toast for feedback

  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [charityAccount, setCharityAccount] = useState('');
  const [raisedAmount, setRaisedAmount] = useState(0);
  const [loadingInitialize, setLoadingInitialize] = useState(false);
  const [loadingDonate, setLoadingDonate] = useState(false);

  const programID = '4RkMT6uz7bu72NSnaYJAKibuagqJeGwr3Qb9iroVCvWu';

  // Simulate fetching the total donations (in a real scenario, this would come from the backend)
  useEffect(() => {
    // Mock fetching raised amount from the backend (replace with actual logic)
    setRaisedAmount(0); // Set raised amount to 0 for demonstration
  }, []);

  const getWallet = (): BrowserWallet | null => {
    if (publicKey && signTransaction) {
      return {
        publicKey,
        signTransaction: (transaction: Transaction) => signTransaction(transaction) as Promise<Transaction>,
        payer: publicKey,
      };
    }
    return null;
  };

  const handleInitialize = async () => {
    const wallet = getWallet();
    if (connected && wallet && dueDate) {
      setLoadingInitialize(true); // Show loading state for Initialize button
      try {
        const provider = new AnchorProvider(
          window.solana,
          wallet as unknown as Wallet,
          {}
        );
        const charity = await initializeCharity(provider, parseInt(dueDate));
        setCharityAccount(charity.publicKey.toString());
        toast({
          title: 'Charity Initialized.',
          description: `Charity account created: ${charity.publicKey.toString()}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error Initializing Charity.',
          description: `There was an error: ${error}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoadingInitialize(false);
      }
    } else {
      toast({
        title: 'Error.',
        description: 'Wallet not connected or due date missing.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDonate = async () => {
    const wallet = getWallet();
    if (connected && wallet && charityAccount && amount) {
      console.log("Donating", amount, "to charity", charityAccount); // Add logging
      setLoadingDonate(true); // Show loading state for Donate button
      try {
        const provider = new AnchorProvider(
          window.solana,
          wallet as unknown as Wallet,
          {}
        );
  
        // Get the transaction from the donate function
        const transaction = await donate(provider, new PublicKey(charityAccount), parseInt(amount));
  
        // Logging to confirm the transaction creation
        console.log("Transaction to be sent:", transaction);
  
        // Send the transaction and confirm it
        const signature = await sendTransaction(transaction, provider.connection);
        console.log("Transaction signature:", signature);
  
        await provider.connection.confirmTransaction(signature);
  
        toast({
          title: 'Donation Successful.',
          description: `You donated ${amount} SOL to the charity.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error during donation:", error); // Log the error
        toast({
          title: 'Error Donating.',
          description: `There was an error: ${error}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoadingDonate(false);
      }
    } else {
      toast({
        title: 'Error.',
        description: 'Wallet not connected or charity account/amount missing.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex minHeight="100vh" alignItems="center" justifyContent="center" bg="gray.50">
      <Box bg="white" p={8} rounded="lg" shadow="lg" textAlign="center" maxWidth="500px" w="100%">
        <VStack spacing={4}>
          <Heading as="h1" size="xl">
            Welcome to Dog Pound Charity
          </Heading>
          <Text fontSize="md" color="gray.600">
            This is the program ID: <strong>{programID}</strong>
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            Raised till now: {raisedAmount} SOL
          </Text>

          <Input
            placeholder="Due Date (Unix timestamp)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            size="lg"
            focusBorderColor="blue.500"
          />
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInitialize}
            isDisabled={!connected || loadingInitialize}
            isLoading={loadingInitialize}
            colorScheme="blue"
            size="lg"
            width="100%"
          >
            Initialize Charity
          </MotionButton>

          <Input
            placeholder="Donation Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="lg"
            focusBorderColor="green.500"
          />
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDonate}
            isDisabled={!connected || !charityAccount || loadingDonate}
            isLoading={loadingDonate}
            colorScheme="green"
            size="lg"
            width="100%"
          >
            Donate
          </MotionButton>
        </VStack>
      </Box>
    </Flex>
  );
};
