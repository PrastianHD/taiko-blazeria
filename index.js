import { ethers } from "ethers";
import readline from 'readline';

async function promptUser(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

async function main() {
    const { log } = await import('./utils/logger.js');
    const { printName } = await import('./utils/name.js');
    printName();
    const privateKey = await promptUser('Enter Private Key: ');
    const provider = new ethers.JsonRpcProvider("https://rpc.mainnet.taiko.xyz");
    const wallet = new ethers.Wallet(privateKey, provider);

    // WETH ABI
    const abiWETH = [
        "function balanceOf(address) public view returns(uint)",
        "function deposit() public payable",
        "function transfer(address, uint) public returns (bool)",
        "function withdraw(uint) public",
        "function approve(address, uint) public returns (bool)",
    ];

    // WETH contract address
    const addressWETH = '0xf531B8F309Be94191af87605CfBf600D71C2cFe0';
    const contractWETH = new ethers.Contract(addressWETH, abiWETH, wallet);

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomDelay() {
        const minDelay = 1; // Minimum delay in seconds
        const maxDelay = 60; // Maximum delay in seconds
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000; // Convert to milliseconds
        return delay;
    }
    
    function generateRandomAmount() {
        const amounts = Math.floor(Math.random() * 90) + 10;
        const amountInETH = "0.0000000" + amounts.toString().padStart(2, '0');
        return ethers.parseUnits(amountInETH, 'ether'); 
    }

    function generateRandomAmountString() {
        const amounts = Math.floor(Math.random() * 90) + 10;
        const amountInETH = "0.0000000" + amounts.toString().padStart(2, '0');
        return amountInETH;
    }
    
    const transactionCount = 150; 

    async function depositTransactions(transactionCount) {
        let successCount = 0;
        let totalAttempts = 0;

        while (successCount < transactionCount) {
            let retryCount = 0;
            const maxRetries = 3;
    
            while (retryCount < maxRetries) {
                try {
                    if (totalAttempts % 2 === 0) {
                        const deposit = await contractWETH.deposit({ value: generateRandomAmount() });
                        successCount++;
                        log('SUCCESS', `Transaction ${successCount} with hash: ${deposit.hash}`);
                        await delay(randomDelay());
                    } else {
                        const withdraw = await contractWETH.withdraw(ethers.parseEther(generateRandomAmountString()));
                        successCount++;
                        log('SUCCESS', `Transaction ${successCount} with hash: ${withdraw.hash}`);
                        await delay(randomDelay());
                    }
                    break;

                } catch (error) {
                    retryCount++;
                    let errorMessage = error.message;
                    if (error.code === 'INSUFFICIENT_FUNDS') {
                        errorMessage = 'INSUFFICIENT_FUNDS';
                    }
                    if (error.code === 'SERVER_ERROR') {
                        errorMessage = 'Service Temporarily Unavailable';
                    }
                    log('ERROR', `Error sending transaction, retry ${retryCount}: ${errorMessage}`);
                    await delay(1000); 
                }
            }

            totalAttempts++;
            await delay(100); 
        }
    }

    await depositTransactions(transactionCount);
}

main().catch(console.error);
