import { useState } from 'react';
import { Box, VStack, Button, Input, Text, useToast, FormControl, FormLabel, Flex, Badge, HStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Idl, Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import idl from '../../../../charity_contract/target/idl/charity_contract.json'; // Add the IDL of your contract
import { PublicKey } from '@solana/web3.js';
import MotionBox from '../utils/MotionBox';
import { MdOutlineAccountBalance, MdOutlineAttachMoney, MdAccountBalanceWallet } from 'react-icons/md';
import { AnimatePresence, motion } from 'framer-motion';

// Define the CharityContractInterface component
export default function CharityContractInterface() {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const toast = useToast();
    const [dueDate, setDueDate] = useState('');
    const [charityWalletAddress, setCharityWalletAddress] = useState('');
    const [donationAmount, setDonationAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [charityInfo, setCharityInfo] = useState<any>(null); // Store the program info
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for the error message
    // Setup Anchor provider
    const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: "processed" });
    const program = new Program(idl as Idl, provider);

    // Initialize Program Function
    const initializeProgram = async () => {
        if (!publicKey || !dueDate || !charityWalletAddress) {
            toast({
                title: "Missing Inputs",
                description: "Please provide the due date and charity wallet address.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setLoading(true);
            const unixTimestamp = Math.floor(new Date(dueDate).getTime() / 1000); // Convert to Unix timestamp

            const tx = await program.methods.initiateProgram(new BN(unixTimestamp), charityWalletAddress).accounts({
                user: publicKey,
            }).rpc();

            toast({
                title: "Program Initialized",
                description: `Transaction: ${tx}`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

        } catch (error) {
            console.error("Error initializing program:", error);
            toast({
                title: "Transaction Failed",
                description: `Error initializing program.`,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Donate Function
    const donate = async () => {
        if (!publicKey || !donationAmount) {
            toast({
                title: "Missing Inputs",
                description: "Please enter a donation amount.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setLoading(true);
            const lamports = parseFloat(donationAmount) * 10 ** 9;

            // Fetch the necessary accounts (replace with actual account public keys if needed)
            const [charityPda] = await PublicKey.findProgramAddress(
                [Buffer.from("charity")],
                program.programId
            );
            const [treasuryPda] = await PublicKey.findProgramAddress(
                [Buffer.from("treasury")],
                program.programId
            );

            const tx = await program.methods.donate(new BN(lamports)).accounts({
                charity: charityPda, // Provide the charity PDA
                treasuryPda: treasuryPda, // Provide the treasury PDA
                donor: publicKey, // Donor's wallet address (the user)
            }).rpc();

            toast({
                title: "Donation Successful",
                description: `Transaction: ${tx}`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

        } catch (error) {
            console.error("Error during donation:", error);
            toast({
                title: "Transaction Failed",
                description: `Error sending donation.`,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Check Time and Transfer Function
   // Check Time and Transfer Function
// Check Time and Transfer Function
const checkTimeAndTransfer = async () => {
    if (!publicKey) {
        toast({
            title: "No Wallet Connected",
            description: "Please connect your wallet first.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    try {
        setLoading(true);

        // Derive the PDA for the charity program
        const [charityPda] = await PublicKey.findProgramAddress(
            [Buffer.from("charity")],
            program.programId
        );

        // Fetch the charity account info to get the dogPoundWallet dynamically
        const charityInfo = await program.account.charity.fetch(charityPda);
        const dogPoundWallet = charityInfo.dogPoundWallet;

        const tx = await program.methods.checkTimeAndTransfer().accounts({
            user: publicKey,         // The user initiating the transaction
            dogPoundWallet: dogPoundWallet, // Dynamically fetched charity wallet receiving the funds
        }).rpc();

        toast({
            title: "Transfer Successful",
            description: `Transaction: ${tx}`,
            status: "success",
            duration: 5000,
            isClosable: true,
        });

    } catch (error: any) {
        console.error("Error during transfer:", error);
        // Set error message for animation if it's NotDueDate
        if (error.message.includes('Not Due Date')) {
            setErrorMessage("Not the due date yet. Transfer not allowed.");
        } else {
            toast({
                title: "Transaction Failed",
                description: `Error during transfer.`,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    } finally {
        setLoading(false);
    }
};

// Animation Variants for the Sliding Error Box
const slideInVariant = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
};

    // Get Charity Info Function
  // Get Charity Info Function
// Get Charity Info Function
const getCharityInfo = async () => {
    if (!publicKey) {
        toast({
            title: "No Wallet Connected",
            description: "Please connect your wallet first.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    try {
        setLoading(true);

        // Derive the PDA for the charity program
        const [charityPda] = await PublicKey.findProgramAddress(
            [Buffer.from("charity")],
            program.programId
        );

        // Check if the charity PDA has been initialized by fetching its account info
        const accountInfo = await provider.connection.getAccountInfo(charityPda);
        if (accountInfo === null) {
            // If no account exists, the program has not been initialized
            toast({
                title: "Program Not Initialized",
                description: "Charity program has not been initialized yet.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            setCharityInfo(null); // Clear existing info
            return;
        }

        // If the account exists, fetch the charity account data
        const charityInfo = await program.account.charity.fetch(charityPda);
        console.log("Charity Info:", charityInfo);

        // Destructure and format the charity info
        const dogPoundWallet = charityInfo.dogPoundWallet.toString();
        const totalDonations = charityInfo.totalDonations.toString();
        const dueDate = new Date(charityInfo.dueDate.toNumber() * 1000).toLocaleString();
        const donationAllowed = charityInfo.donationAllowed;

        // Get the balance of the treasury PDA
        const [treasuryPda] = await PublicKey.findProgramAddress(
            [Buffer.from("treasury")],
            program.programId
        );
        const treasuryBalance = await provider.connection.getBalance(treasuryPda) / 10 ** 9; // Convert lamports to SOL
        console.log("Treasury Balance:", treasuryBalance);

        // Update state with the fetched charity info
        setCharityInfo({
            dogPoundWallet,
            totalDonations,
            dueDate,
            donationAllowed,
            treasuryBalance, // Convert lamports to SOL
            charityPda: charityPda.toBase58(),
            treasuryPda: treasuryPda.toBase58(),
        });

        toast({
            title: "Charity Info Fetched",
            description: "Charity info successfully retrieved.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });

    } catch (error) {
        console.error("Error fetching charity info:", error);
        toast({
            title: "Transaction Failed",
            description: "Error fetching charity info.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
    } finally {
        setLoading(false);
    }
};

const primaryColor = useColorModeValue('yellow.500', 'red.200');
const bgGradient = useColorModeValue(
    'linear(to-r, teal.500, yellow.500)',
    'linear(to-r, teal.300, blue.300)'
);


    return (
        <Flex align="center" justify="center" height="100vh">
               {/* Error Message Animation */}
             
            <Box p={4} w="full" maxW="md">
                <VStack spacing={6}>
                <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        variants={slideInVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'fixed',
                            right: 0,
                            bottom: '10%',
                            zIndex: 9999,
                            background: 'white',
                            border: '2px solid red',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            color: 'red',
                            fontWeight: 'bold'
                        }}
                    >
                        {errorMessage}
                        <Button size="sm" ml={4} onClick={() => setErrorMessage(null)}>
                            Close
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
                    {/* Charity Info */}
                    {charityInfo ? (
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
                            bgGradient={bgGradient}
                            color="white"
                        >
                            <VStack spacing={4} align="start">
                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAccountBalance} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Charity PDA Address:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.charityPda.slice(0, 4)}...{charityInfo.charityPda.slice(-4)}
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAccountBalance} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Treasury PDA Address:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.treasuryPda.slice(0, 4)}...{charityInfo.treasuryPda.slice(-4)}
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAttachMoney} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Total Donations:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.totalDonations} SOL
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAttachMoney} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Treasury Balance:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.treasuryBalance} SOL
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdAccountBalanceWallet} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Charity Wallet:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.dogPoundWallet.slice(0, 4)}...{charityInfo.dogPoundWallet.slice(-4)}
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAccountBalance} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Due Date:
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" color={primaryColor}>
                                        {charityInfo.dueDate}
                                    </Text>
                                </HStack>

                                <HStack spacing={3} w="full">
                                    <Icon as={MdOutlineAccountBalance} boxSize={6} />
                                    <Text fontSize="sm" color="whiteAlpha.800">
                                        Donation Allowed:
                                    </Text>
                                    <Badge
                                        colorScheme={charityInfo.donationAllowed ? 'green' : 'red'}
                                        variant="solid"
                                        fontSize="0.8em"
                                        borderRadius="full"
                                        px={3}
                                    >
                                        {charityInfo.donationAllowed ? "Yes" : "No"}
                                    </Badge>
                                </HStack>
                            </VStack>
                        </MotionBox>
                    ) : (
                        <Text>Please connect your wallet to get charity info.</Text>
                    )}

                    <Button mt={4} colorScheme="green" onClick={getCharityInfo} isLoading={loading}>
                        Get Charity Info
                    </Button>
                    {/* Initialize Program Section */}
                    <FormControl>
                        <FormLabel>Due Date</FormLabel>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        <FormLabel>Charity Wallet Address</FormLabel>
                        <Input
                            value={charityWalletAddress}
                            onChange={(e) => setCharityWalletAddress(e.target.value)}
                            placeholder="Charity Wallet Address"
                        />
                        <Button
                            mt={4}
                            colorScheme="teal"
                            onClick={initializeProgram}
                            isLoading={loading}
                        >
                            Initialize Program
                        </Button>
                    </FormControl>

                    {/* Donation Section */}
                    <FormControl>
                        <FormLabel>Donation Amount (SOL)</FormLabel>
                        <Input
                            type="number"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            placeholder="Amount"
                        />
                        <Button
                            mt={4}
                            colorScheme="blue"
                            onClick={donate}
                            isLoading={loading}
                        >
                            Donate
                        </Button>
                    </FormControl>

                    {/* Check Time and Transfer Section */}
                    <Button
                        mt={4}
                        colorScheme="red"
                        onClick={checkTimeAndTransfer}
                        isLoading={loading}
                    >
                        Check Time and Transfer
                    </Button>

                    {/* Get Charity Info Button */}
                    <Button
                        mt={4}
                        colorScheme="green"
                        onClick={getCharityInfo}
                        isLoading={loading}
                    >
                        Get Charity Info
                    </Button>
                </VStack>
            </Box>
        </Flex>
    );
}
