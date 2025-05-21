import {ethers, Provider} from "ethers";
// @ts-ignore
import contractAbi from "./contracts/contracts_AddressList_sol_AddressList.abi.json" with { type: "json" };

export function matchAddressInContract(contractAddress: string, provider: Provider) {
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    return async (address: string) => {
        return contract.isAddressInList(address);
    }
}