"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { cn } from "@/lib/utils";

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
            // Cast window to any to avoid TS error with 'ethereum'
            if (typeof (window as any).ethereum !== "undefined") {
                try {
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        const address = await accounts[0].getAddress();
                        setAccount(address);
                        if (onConnect) onConnect(address);
                    }
                } catch (err) {
                    console.error("Failed to check wallet connection", err);
                }
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

        if (typeof (window as any).ethereum === "undefined") {
            alert("Please install MetaMask!");
            return;
        }

        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            // Request access
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            if (onConnect) onConnect(address);
        } catch (err: any) {
            console.error("Connection error", err);
            // MetaMask error code -32002: Request of type 'wallet_requestPermissions' already pending
            if (err.code === -32002 || (err.info && err.info.error && err.info.error.code === -32002)) {
                alert("A connection request is already pending. Please open your MetaMask extension to approve it.");
            } else if (err.code === 4001) {
                // User rejected request
                console.log("User rejected connection");
            } else {
                alert("Failed to connect wallet: " + (err.message || "Unknown error"));
            }
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
