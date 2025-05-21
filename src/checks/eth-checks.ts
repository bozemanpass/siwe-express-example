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
            console.log(`Chain ID mismatch: expected ${chainId}, got ${network.chainId}`);
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
export function addressListedInContract(contractAddress: string, provider: Provider): SigninChecker {
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