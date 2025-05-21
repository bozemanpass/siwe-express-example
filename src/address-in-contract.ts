import {ethers, Provider} from "ethers";

import {SigninChecker} from "./siwe-auth-provider.js";

// @ts-ignore
import contractAbi from "./contracts/contracts_AddressList_sol_AddressList.abi.json" with { type: "json" };

export function matchAddressInContract(contractAddress: string, provider: Provider): SigninChecker {
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