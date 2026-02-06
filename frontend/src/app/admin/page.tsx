"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import contractsConfig from '@/lib/contracts-config.json';
import { ContractABIs } from '@/lib/contracts';
import { toast } from 'sonner';

export default function AdminPage() {
    const [targetAddress, setTargetAddress] = useState("");
    const [loading, setLoading] = useState(false);

    // NFT Minting state
    const [nftRecipient, setNftRecipient] = useState("");
    const [nftUri, setNftUri] = useState("");
    const [mintingNft, setMintingNft] = useState(false);

    const getComplianceContract = async () => {
        if (typeof (window as any).ethereum === "undefined") throw new Error("No Wallet");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(contractsConfig.complianceAddress, ContractABIs.ComplianceRegistry, signer);
    };

    const getNftContract = async () => {
        if (typeof (window as any).ethereum === "undefined") throw new Error("No Wallet");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(contractsConfig.nftAddress, ContractABIs.AssetNFT, signer);
    };

    const handleWhitelist = async () => {
        if (!targetAddress) return;
        setLoading(true);
        const toastId = toast.loading("Whitelisting user...");
        try {
            const contract = await getComplianceContract();
            const tx = await contract.addToWhitelist(targetAddress);
            console.log("Transaction sent:", tx.hash);
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("User Whitelisted", { description: `${targetAddress} can now trade.` });
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Action Failed", { description: error.reason || error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!targetAddress) return;
        setLoading(true);
        const toastId = toast.loading("Revoking access...");
        try {
            const contract = await getComplianceContract();
            const tx = await contract.addToBlacklist(targetAddress);
            console.log("Transaction sent:", tx.hash);
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("User Blacklisted", { description: `${targetAddress} access revoked.` });
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Action Failed", { description: error.reason || error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleMintNft = async () => {
        if (!nftRecipient || !nftUri) {
            toast.error("Please fill in recipient and URI");
            return;
        }
        setMintingNft(true);
        const toastId = toast.loading("Minting NFT...");
        try {
            const contract = await getNftContract();
            const tx = await contract.mint(nftRecipient, nftUri);
            console.log("Mint transaction sent:", tx.hash);
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("NFT Minted!", { description: `"${nftUri}" minted to ${nftRecipient.slice(0, 6)}...` });
            setNftUri("");
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Mint Failed", { description: error.reason || error.message });
        } finally {
            setMintingNft(false);
        }
    };

    // Pre-defined art pieces that can be minted
    const artPieces = [
        "Mona Lisa #1 - Analysis",
        "Starry Night #2",
        "The Scream #3",
        "The Persistence of Memory #4",
        "Girl with a Pearl Earring #5"
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">🔧 Admin Panel</h1>
                <p className="text-gray-500 mt-2">Manage KYC compliance, mint NFTs, and update oracle prices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Whitelist Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">👤 Compliance Management</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">User Address</label>
                            <input
                                type="text"
                                placeholder="0x..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                value={targetAddress}
                                onChange={(e) => setTargetAddress(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleWhitelist}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Whitelist User"}
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={loading}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Revoke Access"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* NFT Minting */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">🎨 Mint NFT (Pre-create)</h2>
                    <p className="text-sm text-gray-500 mb-4">Mint NFTs to an address. They can then be listed for sale.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                            <input
                                type="text"
                                placeholder="0x..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border font-mono"
                                value={nftRecipient}
                                onChange={(e) => setNftRecipient(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">NFT Name/URI</label>
                            <input
                                type="text"
                                placeholder="Enter name or select below"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={nftUri}
                                onChange={(e) => setNftUri(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {artPieces.map((art) => (
                                <button
                                    key={art}
                                    onClick={() => setNftUri(art)}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-indigo-100 hover:text-indigo-700 transition"
                                >
                                    {art.split(" #")[0]}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleMintNft}
                            disabled={mintingNft}
                            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                        >
                            {mintingNft ? "Minting..." : "Mint NFT"}
                        </button>
                    </div>
                </div>

                {/* Oracle Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">📊 Oracle Updates</h2>
                    <p className="text-sm text-gray-500 mb-4">Update asset prices manually (Admin only).</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="p-2 border rounded-md" placeholder="Asset Symbol (e.g. GLD)" />
                        <input className="p-2 border rounded-md" placeholder="Price in ETH (e.g. 0.01)" />
                        <button className="bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 font-medium">
                            Update Price
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

