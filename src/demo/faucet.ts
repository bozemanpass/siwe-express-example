import {ethers, Provider} from "ethers";

// @ts-ignore
import contractAbi from "../contracts/contracts_AddressList_sol_AddressList.abi.json" with { type: "json" };


export const whitelistAddress = async (address: string, provider: Provider) => {
    const wallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(process.env.WHITELIST_CONTRACT_ADDRESS!, contractAbi, wallet);
    const tx = await contract.addAddress(address);
    return tx.wait(1);
}

export const blacklistAddress = async (address: string, provider: Provider) => {
    const wallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(process.env.WHITELIST_CONTRACT_ADDRESS!, contractAbi, wallet);
    const tx = await contract.removeAddress(address);
    return tx.wait(1);
}

export const faucet = async (address: string, provider: Provider, wei=1000n) => {
    const wallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY!, provider);
    const tx = await wallet.sendTransaction({
        to: address,
        value: wei
    });
    return tx.wait(1);
}