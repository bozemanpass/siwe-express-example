import {ethers, Provider} from "ethers";

import {SigninChecker} from "../siwe-auth-provider.js";

// @ts-ignore
import contractAbi from "../contracts/contracts_AddressList_sol_AddressList.abi.json" with { type: "json" };

/**
 * Checks if the chain ID of the provider matches the chain ID of the SiwE message.
 * @param provider - The provider to use to determine the chain ID.
 * @returns a function that checks if the chain IDs match.
 */
export function sameNetwork(provider: Provider): SigninChecker {
    return async (address: string, chainId: number) => {
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(chainId)) {
            console.log(`Chain ID mismatch: expected ${network.chainId}, got ${chainId}`);
            return false;
        }
        return true;
    }
}

/**
 * Calls the specified contract's "isAddressInList" function to see if the address is listed in the contract.
 * @param contractAddress - The address of the contract to check.
 * @param provider - The provider to use to call the contract.
 * @returns a function that checks if the address is listed in the contract.
 */
export function addressListedInContract(contractAddress: string, provider?: Provider): SigninChecker {
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    return async (address: string, chainId: number) => {
        const ret = await contract.isAddressInList(address);
        if (ret) {
            console.log(`Address ${address} is in contract ${contractAddress} on chain ${chainId}`)
        } else {
            console.log(`Address ${address} is NOT in contract ${contractAddress} on chain ${chainId}`)
        }
        return ret;
    }
}

/**
 * Checks if the address has a minimum balance.
 * @param minBalance - The minimum balance required in wei.
 * @param provider - The provider to use to check the balance.
 * @returns a function that checks if the address has the minimum required balance.
 */
export function minimumBalance(minBalance: bigint, provider: Provider): SigninChecker {
    return async (address: string, chainId: number) => {
        if (minBalance <= 0n) {
            return true;
        }

        const balance = await provider.getBalance(address);
        if (balance >= minBalance) {
            console.log(`Address ${address} balance ${balance} >= ${minBalance}`)
            return true;
        }

        console.log(`Address ${address} balance ${balance} less than minimum required balance ${minBalance}`)
        return false;
    }
}

/**
 * A dummy function that always returns true.
 * @returns true
 */
export const sayYes = async () => true;