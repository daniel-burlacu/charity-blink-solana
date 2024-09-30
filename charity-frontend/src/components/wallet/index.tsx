// src/components/WalletInfo.tsx
import { VStack, Text, HStack, Badge, Icon, useColorModeValue } from '@chakra-ui/react';
import { MdAccountBalanceWallet, MdOutlineAccountBalance } from 'react-icons/md';
import MotionBox from '../utils/MotionBox';  // Import the custom MotionBox component

interface WalletInfoProps {
  network: string;
  balance: number;
  publicKey: string;
}

export function WalletInfo({ network, balance, publicKey }: WalletInfoProps) {
  const primaryColor = useColorModeValue('yellow.500', 'red.200');
  const bgGradient = useColorModeValue(
    'linear(to-r, teal.500, yellow.500)',
    'linear(to-r, teal.300, blue.300)'
  );

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="lg"
      w="full"
      maxW="md"
      bgGradient={bgGradient}
      color="white"
    >
      <VStack spacing={4} align="start">
        <HStack spacing={3} w="full">
          <Icon as={MdAccountBalanceWallet} boxSize={6} />
          <Text fontSize="sm" color="whiteAlpha.800">
            Network:
          </Text>
          <Badge
            colorScheme={network === 'Mainnet' ? 'red' : 'green'}
            variant="solid"
            fontSize="0.8em"
            borderRadius="full"
            px={3}
          >
            {network}
          </Badge>
        </HStack>
        <HStack spacing={3} w="full">
          <Icon as={MdOutlineAccountBalance} boxSize={6} />
          <Text fontSize="sm" color="whiteAlpha.800">
            Wallet Address:
          </Text>
          <Text fontSize="md" fontWeight="bold" color={primaryColor}>
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </Text>
        </HStack>
        <HStack spacing={3} w="full">
          <Icon as={MdOutlineAccountBalance} boxSize={6} />
          <Text fontSize="sm" color="whiteAlpha.800">
            Balance:
          </Text>
          <Text fontSize="md" fontWeight="bold" color={primaryColor}>
            {balance !== null ? `${balance} SOL` : 'Fetching...'}
          </Text>
        </HStack>
      </VStack>
    </MotionBox>
  );
}
