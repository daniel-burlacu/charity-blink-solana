// src/buttons/air-drop-btn.tsx
import { useState, useEffect } from 'react';
import { Button, Tooltip } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface AirdropButtonProps {
  onAirdropSuccess: () => void;
}

export function AirdropButton({ onAirdropSuccess }: AirdropButtonProps) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const lastAirdropTime = localStorage.getItem('lastAirdropTime');
    if (lastAirdropTime) {
      const timeDifference = Date.now() - parseInt(lastAirdropTime, 10);
      if (timeDifference < 24 * 60 * 60 * 1000) {
        setIsDisabled(true);
      }
    }
  }, []);

  const handleAirdrop = async () => {
    if (publicKey) {
      try {
        const signature = await connection.requestAirdrop(publicKey, 1 * 10 ** 9); // Request 1 SOL (in lamports)
        await connection.confirmTransaction(signature, 'confirmed');
        setIsDisabled(true);
        localStorage.setItem('lastAirdropTime', Date.now().toString());
        onAirdropSuccess(); // Call the callback function to update balance
      } catch (error) {
        console.error('Airdrop failed:', error);
      }
    }
  };

  return (
    <Tooltip
      label="This button is disabled for 24 hours after use."
      isDisabled={!isDisabled}
    >
      <Button
        colorScheme="primary"
        onClick={handleAirdrop}
        isDisabled={isDisabled}
        _disabled={{ cursor: 'not-allowed', opacity: 0.6 }}
      >
        Request 1 SOL Airdrop
      </Button>
    </Tooltip>
  );
}
