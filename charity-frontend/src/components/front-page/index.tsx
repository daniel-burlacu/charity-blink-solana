import { useEffect, useState } from 'react';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AirdropButton } from '../buttons/air-drop-btn';
import { SendSolButton } from '../buttons/send-sol-btn';
import { WalletInfo } from '../wallet'; // Import the WalletInfo component
import CharityContractInterface from '../charity-contract/CharityContractInterface'; // Import the CharityContractInterface

export function FrontPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState('Devnet'); // Assuming Devnet as default

  const fetchBalance = async () => {
    if (publicKey) {
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 10 ** 9); // Convert lamports to SOL
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey, connection]);

  useEffect(() => {
    // Set the network based on the connection URL
    const url = connection.rpcEndpoint;
    if (url.includes('devnet')) {
      setNetwork('Devnet');
    } else if (url.includes('testnet')) {
      setNetwork('Testnet');
    } else if (url.includes('mainnet')) {
      setNetwork('Mainnet');
    } else {
      setNetwork('Localnet');
    }
  }, [connection]);

  return (
    <Box p={4}>
      <VStack spacing={6}>
        <Heading as="h1" size="lg" mb={4}>
          My Solana dApp
        </Heading>
        <WalletMultiButton />

        {connected && publicKey ? (
          <>
            {/* Display wallet information when connected */}
            <WalletInfo network={network} balance={balance} publicKey={publicKey.toBase58()} />

            {/* Airdrop and Send SOL buttons */}
            <AirdropButton onAirdropSuccess={fetchBalance} />
            <SendSolButton onSendSuccess={fetchBalance} />

            {/* Charity Program Box */}
            <Box
              mt={8}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              borderColor="gray.200"
              w="full"
              bg="gray.50"
            >
              <Heading as="h2" size="md" mb={4}>
                Charity Program
              </Heading>

              {/* CharityContractInterface component */}
              <CharityContractInterface />
            </Box>
          </>
        ) : (
          <Text>Please connect your wallet to see the balance and request an airdrop.</Text>
        )}
      </VStack>
    </Box>
  );
}

export default FrontPage;
