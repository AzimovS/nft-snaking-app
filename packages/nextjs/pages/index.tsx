import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { config } from "~~/config";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const MINT_PRICE_ETH = "0.0001";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "NFT",
    functionName: "totalSupply",
    watch: true,
    cacheOnBlock: true,
  });

  const { writeAsync: mintItem } = useScaffoldContractWrite({
    contractName: "NFT",
    functionName: "safeMint",
    args: [connectedAddress],
    value: parseEther("0.1"),
  });
  const nftId = totalSupply !== undefined && parseInt(totalSupply.toString()) + 1;

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl">NFT Snaking App</span>
          </h1>
        </div>
        <div className="flex justify-center">
          {nftId ? (
            nftId < config.maxSupply ? (
              <div>
                <p>You are about to mint the following NFT: </p>
                <img src={`${config.ipfsUri}/${nftId}.png`} alt="NFT" className="mt-3 w-44 rounded-md" />
                <div className="mt-0">
                  <p className="mb-0">
                    Price: <b>{MINT_PRICE_ETH} ETH</b>
                  </p>
                  <p className="mt-0">
                    ID: <b>{nftId}</b>
                  </p>
                  {!isConnected || isConnecting ? (
                    <RainbowKitCustomConnectButton />
                  ) : (
                    <button className="btn btn-secondary" onClick={() => mintItem()}>
                      Mint NFT
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p>Out of stock</p>
            )
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Home;
