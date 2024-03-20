import { useEffect } from "react";
import { BigNumberish } from "ethers";
import type { NextPage } from "next";
import { Abi } from "viem";
import {
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Spinner } from "~~/components/assets/Spinner";
import { config } from "~~/config";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type contractInfo = {
  address: string | undefined;
  abi: Abi | undefined;
};

const SingleNFTDisplay = ({
  nftId,
  refetchUserTokens,
  nftContract,
  tokenContract,
}: {
  nftId: number;
  refetchUserTokens: () => Promise<unknown>;
  nftContract: contractInfo;
  tokenContract: contractInfo;
}) => {
  const { data: approvedInfo, refetch: refetchGetApproved } = useContractRead({
    address: nftContract.address,
    abi: nftContract.abi,
    functionName: "getApproved",
    args: [BigInt(nftId)],
  });

  const { config: approveConfig } = usePrepareContractWrite({
    address: nftContract.address,
    abi: nftContract.abi,
    functionName: "approve",
    args: [tokenContract.address, BigInt(nftId)],
  });
  const { data: approveData, write: approveToken } = useContractWrite(approveConfig);
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  const { config: stakeConfig, refetch: refetchStakeContractWrite } = usePrepareContractWrite({
    address: tokenContract.address,
    abi: tokenContract.abi,
    functionName: "stake",
    args: [BigInt(nftId)],
  });
  const { data: stakeData, write: stakeToken } = useContractWrite(stakeConfig);
  const { isLoading: isStakeLoading, isSuccess: isStakeSuccess } = useWaitForTransaction({
    hash: stakeData?.hash,
  });

  useEffect(() => {
    if (isApproveSuccess) {
      refetchGetApproved();
      refetchStakeContractWrite();
      notification.success("Successfully approved your NFT!");
    }
  }, [isApproveSuccess, refetchGetApproved, refetchStakeContractWrite]);

  useEffect(() => {
    if (isStakeSuccess) {
      refetchUserTokens();
      notification.success("Successfully staked your NFT!");
    }
  }, [isStakeSuccess, refetchUserTokens]);

  return (
    <div>
      <div>
        <img src={`${config.ipfsUri}/${nftId}.png`} alt="NFT" className="w-full rounded-md" />
        {!approvedInfo || !(approvedInfo === tokenContract.address) ? (
          <button
            className="w-full py-2 mt-3 text-white bg-blue-500 rounded-md hover:opacity-90 transition-opacity"
            onClick={approveToken}
          >
            {isApproveLoading && <Spinner />}
            {!isApproveLoading && "Approve"}
          </button>
        ) : (
          <button
            className="w-full py-2 mt-3 text-white bg-green-500 rounded-md hover:opacity-90 transition-opacity"
            onClick={stakeToken}
          >
            {isStakeLoading && <Spinner />}
            {!isStakeLoading && "Stake"}
          </button>
        )}
      </div>
    </div>
  );
};

const NFTDisplay = ({
  nfts,
  refetchUserTokens,
  tokenContract,
  nftContract,
}: {
  nfts: readonly BigNumberish[];
  refetchUserTokens: () => Promise<unknown>;
  nftContract: contractInfo;
  tokenContract: contractInfo;
}) => {
  if (nfts.length === 0) return <p>{`You don't have any NFTs yet.`}</p>;
  return (
    <div className="grid md:grid-cols-4 gap-x-4 gap-y-6 grid-cols-2">
      {nfts?.map((nft, id) => (
        <SingleNFTDisplay
          nftId={Number(nft)}
          refetchUserTokens={refetchUserTokens}
          key={id}
          nftContract={nftContract}
          tokenContract={tokenContract}
        />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: contractDataNFT } = useDeployedContractInfo("NFT");
  const { data: contractDataToken } = useDeployedContractInfo("ProjectToken");

  const nftContract: contractInfo = {
    address: contractDataNFT?.address,
    abi: contractDataNFT?.abi,
  };

  const tokenContract = {
    address: contractDataToken?.address,
    abi: contractDataToken?.abi,
  };

  const {
    data: userTokens,
    isLoading: isUserTokenLoading,
    refetch: refetchUserTokens,
  } = useContractReads({
    contracts: [
      {
        address: nftContract.address,
        abi: nftContract.abi,
        functionName: "getUserTokens",
        args: [connectedAddress || "0x"],
      },
      {
        address: tokenContract.address,
        abi: tokenContract.abi,
        functionName: "getHolderTokens",
        args: [connectedAddress || "0x"],
      },
    ],
  });

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl">NFT Snaking App</span>
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
                <NFTDisplay
                  nfts={(userTokens?.[0]?.["result"] as BigNumberish[]) || []}
                  refetchUserTokens={refetchUserTokens}
                  nftContract={nftContract}
                  tokenContract={tokenContract}
                />
                <p className="mt-5 mb-3 font-bold">Staked NFTs</p>
                {/* <StakedNFTDisplay
                nfts={userTokens?.[1] || []}
                refetchUserTokens={refetchUserTokens}
                /> */}
              </div>
            )
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Home;
