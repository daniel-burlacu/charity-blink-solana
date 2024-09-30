import ReactDOM from 'react-dom/client'; // Note the change here
import { ChakraProvider } from '@chakra-ui/react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  // WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import App from './App';
import '@solana/wallet-adapter-react-ui/styles.css'; // Optional: for default styles
import theme from './config/theme';

// Define the network you want to connect to (e.g., devnet, testnet, mainnet)
const network = clusterApiUrl('devnet');

// Define the wallets you want to support
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
  new LedgerWalletAdapter(),
];

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!); // createRoot(container!) is the new API in React 18
root.render(
  <ChakraProvider theme={theme}>
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </ChakraProvider>
);
