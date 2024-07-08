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
    const addressWETH = '0xA51894664A773981C6C112C43ce576f315d5b1B6';
    const contractWETH = new ethers.Contract(addressWETH, abiWETH, wallet);

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function generateRandomAmount() {
        const amounts = Math.floor(Math.random() * 90) + 10;
        const amountInETH = "0.0000000" + amounts.toString().padStart(2, '0');
        return ethers.parseUnits(amountInETH, 'ether'); 
    }

    const transactionCount = 2500; 

    async function depositTransactions(transactionCount) {
        let successCount = 0;

        for (let i = 0; i < transactionCount; i++) {
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    const deposit = await contractWETH.deposit({ value: generateRandomAmount() });
                    log('SUCCESS', `Deposit sent with hash: ${deposit.hash}`);
                    const withdraw = await contractWETH.withdraw(ethers.parseEther("0.00000001"));
                    log('SUCCESS', `Withdraw sent with hash: ${withdraw.hash}`);

                    successCount++;
                    break;

                } catch (error) {
                    retryCount++;
                    log('ERROR', `Error sending transaction, retry ${retryCount}: ${error.message}`);
                    await delay(1000); 
                }
            }

            if ((i + 1) % 51 === 0) {
                log('DEBUG', `Completed transactions for this day...`);
                log('DEBUG', `Transaction Next Day...`);
                await delay(24 * 60 * 60 * 1000); 
            }

            await delay(100); 
        }
    }

    await depositTransactions(transactionCount);
}

main().catch(console.error);
