import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Spinner } from "~~/components/assets/Spinner";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { config } from "~~/config";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const MINT_PRICE_ETH = "0.0001";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { data: totalSupply, isLoading: isUserTokenLoading } = useScaffoldContractRead({
    contractName: "ProjectToken",
    functionName: "getHolderTokens",
    args: [connectedAddress],
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
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">NFT Staking App</span>
          </h1>
        </div>

        <div className="max-w-3xl px-3 py-5 mx-auto mb-6">
          {!isConnected && <p>Please connect your account first.</p>}
          {isConnected ? (
            isUserTokenLoading ? (
              <Spinner />
            ) : (
              <div>
                <p className="mb-3 font-bold">My NFTs</p>
                {/* <NFTDisplay
                nfts={userTokens?.[0] || []}
                refetchUserTokens={refetchUserTokens}
                /> */}
                <p className="mt-5 mb-3 font-bold">Staked NFTs</p>
                {/* <StakedNFTDisplay
                nfts={userTokens?.[1] || []}
                refetchUserTokens={refetchUserTokens}
                /> */}
              </div>
            )
          ) : null}
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
