"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { cn } from "@/lib/utils";
import { getEthereumProvider } from "@/lib/ethereum";

interface WalletConnectProps {
    className?: string;
    onConnect?: (address: string) => void;
}

export function WalletConnect({ className, onConnect }: WalletConnectProps) {
    const [account, setAccount] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Check if already connected
    useEffect(() => {
        const checkConnection = async () => {
            const providerSrc = getEthereumProvider();
            if (!providerSrc) return;
            try {
                const provider = new ethers.BrowserProvider(providerSrc as ethers.Eip1193Provider);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    const address = await accounts[0].getAddress();
                    setAccount(address);
                    if (onConnect) onConnect(address);
                }
            } catch {
                // Ignore: often caused by another extension (e.g. evmAsk) owning window.ethereum
            }
        };
        checkConnection();
    }, [onConnect]);

    const handleClick = async () => {
        if (account) {
            try {
                await navigator.clipboard.writeText(account);
                alert("Address copied to clipboard: " + account);
            } catch (err) {
                console.error("Failed to copy", err);
                alert("Could not copy address. Full address: " + account);
            }
            return;
        }

        const providerSrc = getEthereumProvider();
        if (!providerSrc) {
            alert("Please install MetaMask (or another Web3 wallet).");
            return;
        }

        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(providerSrc as ethers.Eip1193Provider);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            if (onConnect) onConnect(address);
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            if (msg.includes("reject") || msg.includes("denied") || err?.code === 4001) {
                // User cancelled in wallet
                return;
            }
            console.error("Wallet connection failed", err);
            alert("Wallet connection failed. Try MetaMask, or disable other wallet extensions (e.g. evmAsk) that may conflict.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                account
                    ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 cursor-pointer"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md",
                className
            )}
        >
            {loading ? "Connecting..." : account ? account.slice(0, 6) + "..." + account.slice(-4) : "Connect Wallet"}
        </button>
    );
}
