"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Safe from "@safe-global/protocol-kit";
import { erc20Abi } from "./erc20Abi";
import SafeApiKit from "@safe-global/api-kit";

// variables to change
const SAFE_ADDRESS = "0x707f6FCAFc92D62A4A43276153698098fB4cb1a1";
let tokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
let numberOfDecimals = 6;
const recipient = "0xCC6903a0D51fA6A04EFB415Dc198d84d5120C1C0";
const amount = "12000";
// --------

const numberOfTokens = ethers.parseUnits(amount, numberOfDecimals);

export default function Home() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [txnWithFirstSign, setTxnWithFirstSign] = useState();
  const [connectedAddress, setConnectedAddress] = useState("");
  const [genosisSafe, setGenosisSafe] = useState();
  const [callData, setCallData] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }

    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer = await _provider.getSigner();

    setProvider(_provider);
    setSigner(_signer);

    console.log("Connected with:", await signer.getAddress());
    return signer;
  };

  useEffect(() => {
    (async () => {
      if (signer && provider) {
        const _connectedAddress = await signer.getAddress();
        console.log("_connectedAddress", _connectedAddress);
        setConnectedAddress(_connectedAddress);

        const _genosisSafe = await Safe.init({
          provider: window.ethereum,
          signer: _connectedAddress,
          // signer: "0xeB1089e9f0B9edcD11Ae6b6a91576c2EE4Cfd7B1",
          safeAddress: SAFE_ADDRESS,
        });

        console.log("_genosisSafe : ProtocolKit init : ", _genosisSafe);

        setGenosisSafe(_genosisSafe);
      } else {
        console.log("signer and provider is not initialised!");
      }
    })();
  }, [provider, signer, connectedAddress]);

  // create and sign with first signer
  const createSafe1 = async () => {
    try {
      if (!connectedAddress) {
        alert("Wallet not connected!");
        return;
      }

      if (!callData) {
        alert("Generate CallData First!");
        return;
      }

      const safeTransaction = await genosisSafe.createTransaction({
        transactions: [
          {
            // to: '0xF70EB631A41F5D21C40256A17d8Afe2B2061CDcB',
            // to: "0x6dfB4BA28112D05C2d74FEA137C0af7B6AcB3687",
            to: tokenAddress,
            value: "0",
            data: callData,
          },
        ],
      });

      console.log("safeTransaction cretaed : ", safeTransaction);

      const signedSafeTransaction = await genosisSafe.signTransaction(
        safeTransaction
      );

      console.log("signedSafeTransaction : ", signedSafeTransaction);
      setTxnWithFirstSign(signedSafeTransaction);
    } catch (e) {
      console.log("error in create safe", e);
    }
  };

  // sign with second signer and execute
  const createSafe2 = async () => {
    try {
      if (!connectedAddress) {
        alert("Wallet not connected!");
        return;
      }

      if (txnWithFirstSign) {
        console.log("txnWithFirstSign", txnWithFirstSign);

        const signedSafeTransaction = await genosisSafe.signTransaction(
          txnWithFirstSign
        );

        console.log(
          "signedSafeTransaction Second signer : ",
          signedSafeTransaction
        );

        const txResponse = await genosisSafe.executeTransaction(
          signedSafeTransaction
          // options // Optional
        );

        console.log("✅  txResponse : ", txResponse);
      } else {
        alert("first initiate the txn from Sign1 !");
        console.log("txnWithFirstSign is Undefined");
      }
    } catch (e) {
      console.log("error in create safe", e);
    }
  };

  // inprogress
  const getPendingTxnLists = async () => {
    try {
      const apiKit = new SafeApiKit({
        chainId: 11155111n, // sepolia
        txServiceUrl: "https://safe-transaction-sepolia.safe.global/api",
      });

      console.log("apiKit", apiKit);

      const pendingTxs = await apiKit.getPendingTransactions(SAFE_ADDRESS);
      console.log("pendingTxs : ", pendingTxs);
    } catch (e) {
      console.error("error in getting pending txns", e);
    }
  };

  // random
  const getCalldata = async () => {
    try {
      if (!connectedAddress) {
        alert("Wallet not connected!");
        return;
      }

      const contractInstance = new ethers.Interface(erc20Abi);

      // console.log("value : ", ethers.parseUnits("0.00001", 18))
      console.log("params", [recipient, numberOfTokens]);
      // Encode the function call
      const callData = await contractInstance.encodeFunctionData("transfer", [
        recipient,
        numberOfTokens,
      ]);

      console.log("callData", callData);
      setCallData(callData);
    } catch (e) {
      console.log("error in calldata", e);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <div>
          <div className="py-5">
            <h3>SAFE ADDRESS : </h3>
            <p>{SAFE_ADDRESS}</p>
          </div>

          <div className="py-5">
            <h3>TOKEN ADDRESS : </h3>
            <p>{tokenAddress}</p>
          </div>

          <div className="py-5">
            <h3>RECIPIENT : </h3>
            <p>{recipient}</p>
          </div>

          <div className="py-5">
            <h3>AMOUNT : </h3>
            <p>{amount}</p>
          </div>
        </div>

        <div className="flex gap-8">
          <button
            className="rounded-3xl bg-amber-200 px-5 py-2 cursor-pointer font-black text-black"
            onClick={connectWallet}
          >
            {connectedAddress
              ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(
                  -6,
                  -1
                )}`
              : "Connect Wallet"}
          </button>

          <button
            className="rounded-3xl bg-amber-200 px-5 py-2 cursor-pointer font-black text-black"
            onClick={getCalldata}
          >
            {" "}
            CallData
          </button>
          <button
            className="rounded-3xl bg-amber-200 px-5 py-2 cursor-pointer font-black text-black"
            onClick={createSafe1}
          >
            {" "}
            Sign1
          </button>

          <button
            className="rounded-3xl bg-amber-200 px-5 py-2 cursor-pointer font-black text-black"
            onClick={createSafe2}
          >
            {" "}
            Sign2
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
