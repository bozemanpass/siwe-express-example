import {ethers, Provider} from "ethers";

import {SiweCheck} from "../siwe-auth-provider.js";

// @ts-expect-error  This path will be correct at runtime, but not at build time.
import contractAbi from "../contracts/contracts_AddressList_sol_AddressList.abi.json" with { type: "json" };
import {SiweMessage} from "simple-siwe";

/**
 * Checks if the chain ID of the provider matches the chain ID of the SiwE message.
 * @param provider - The provider to use to determine the chain ID.
 * @returns a function that checks if the chain IDs match.
 */
export function sameNetwork(provider: Provider): SiweCheck {
    return {
        name: "sameNetwork",
        denialMessage: "The provided chain ID does not match the expected network.",
        check: async (message) => {
            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(message.chainId)) {
                console.log(`Chain ID mismatch: expected ${network.chainId}, got ${message.chainId}`);
                return false;
            }
            return true;
        }
    }
}

/**
 * Calls the specified contract's "isAddressInList" function to see if the address is listed in the contract.
 * @param contractAddress - The address of the contract to check.
 * @param provider - The provider to use to call the contract.
 * @returns a function that checks if the address is listed in the contract.
 */
export function addressListedInContract(contractAddress: string, provider?: Provider): SiweCheck {
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);

    return {
        name: "whitelist",
        denialMessage: "The account has not been whitelisted.",
        check: async (message) => {
            const ret = await contract.isAddressInList(message.address);
            if (ret) {
                console.log(`Address ${message.address} is in contract ${contractAddress}`)
            } else {
                console.log(`Address ${message.address} is NOT in contract ${contractAddress}`)
            }
            return ret;
        }
    }
}

/**
 * Checks if the address has a minimum balance.
 * @param minBalance - The minimum balance required in wei.
 * @param provider - The provider to use to check the balance.
 * @returns a function that checks if the address has the minimum required balance.
 */
export function minimumBalance(minBalance: bigint, provider: Provider): SiweCheck {
    return {
        name: 'minBalance',
        denialMessage: "The account does not have the required minimum balance.",
        check: async (message: SiweMessage) => {
            if (minBalance <= 0n) {
                return true;
            }

            const balance = await provider.getBalance(message.address);
            if (balance >= minBalance) {
                console.log(`Address ${message.address} balance ${balance} >= ${minBalance}`)
                return true;
            }

            console.log(`Address ${message.address} balance ${balance} less than minimum required balance ${minBalance}`)
            return false;
        }
    }
}

/**
 * A dummy SiweCheck that always returns true.
 * @returns true
 */
export const sayYes = {
    name: 'yes',
    check: async() => true
}