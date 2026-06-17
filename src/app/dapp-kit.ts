import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

// SuiJsonRpcClient uses JSON-RPC/REST — correct for the standard Sui testnet fullnode.
// (SuiGrpcClient requires a gRPC-Web endpoint, which fullnode.testnet.sui.io is not.)
export const dAppKit = createDAppKit({
  networks: ["testnet"],
  createClient: (network) =>
    new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(network as "testnet"),
      network: network as "testnet",
    }),
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
