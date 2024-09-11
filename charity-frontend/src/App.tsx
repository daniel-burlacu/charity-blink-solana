import React from 'react';
import { WalletContextProvider } from './components/WalletContextProvider';
import { Flex, Box } from '@chakra-ui/react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CharityComponent } from './components/CharityComponent';

const App: React.FC = () => {
  return (
    <WalletContextProvider>
      {/* Outer Flex container to center everything */}
      <Flex minHeight="100vh" alignItems="center" justifyContent="center" bg="gray.50">
        {/* Inner Box with content centered */}
        <Box textAlign="center" p={8} bg="white" borderRadius="md" boxShadow="md">
          <WalletMultiButton />
          <CharityComponent />
        </Box>
      </Flex>
    </WalletContextProvider>
  );
};

export default App;
