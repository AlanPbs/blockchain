"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { cn } from "@/lib/utils";
import contractsConfig from '@/lib/contracts-config.json';
import { ContractABIs } from '@/lib/contracts';
import { toast } from 'sonner';

// Mock Metadata for demo
const ART_IMAGES: Record<string, string> = {
    "Mona Lisa #1 - Analysis": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    "Starry Night #2": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1200px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
    "The Scream #3": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73.5_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73.5_cm%2C_National_Gallery_of_Norway.jpg"
};

export default function GalleryPage() {
    const [nfts, setNfts] = useState<{ id: number, uri: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [minting, setMinting] = useState(false);
    const [transferringId, setTransferringId] = useState<number | null>(null);
    const [recipient, setRecipient] = useState("");
    const [available, setAvailable] = useState<Record<string, boolean>>({});

    const fetchNFTs = async () => {
        if (typeof (window as any).ethereum === "undefined") return;
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const nftContract = new ethers.Contract(contractsConfig.nftAddress, ContractABIs.AssetNFT, signer);

            const balance = await nftContract.balanceOf(address);
            const items = [];

            // Naive check for first 20 IDs (for demo)
            for (let i = 0; i < 20; i++) {
                try {
                    const owner = await nftContract.ownerOf(i);
                    if (owner.toLowerCase() === address.toLowerCase()) {
                        const uri = await nftContract.tokenURI(i);
                        items.push({ id: i, uri });
                    }
                } catch (e) {
                    // ignore
                }
            }
            setNfts(items);
        } catch (err) {
            console.error("NFT Fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async () => {
        if (typeof (window as any).ethereum === "undefined") return;
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            // ContractABIs must be updated with mintedURIs
            const contract = new ethers.Contract(contractsConfig.nftAddress, ContractABIs.AssetNFT, signer);

            const status: Record<string, boolean> = {};
            for (const art of Object.keys(ART_IMAGES)) {
                // If true, it's minted (so NOT available)
                // Wait, if mintedURIs returns true, it's taken.
                const isMinted = await contract.mintedURIs(art);
                status[art] = !isMinted;
            }
            setAvailable(status);
        } catch (e) {
            console.error("Availability check failed", e);
        }
    };

    useEffect(() => {
        fetchNFTs();
        checkAvailability();
    }, []);

    const handleBuy = async (artName: string) => {
        if (available[artName] === false) {
            toast.error("Sold Out", { description: "This masterpiece has already been minted." });
            return;
        }

        setMinting(true);
        const toastId = toast.loading("Minting NFT...");
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractsConfig.nftAddress, ContractABIs.AssetNFT, signer);

            const tx = await contract.buyNFT(artName, { value: ethers.parseEther("0.001") });
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("NFT Minted Successfully!", { description: `You own ${artName}` });
            fetchNFTs();
            checkAvailability();
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Mint Failed", { description: error.reason || error.message });
        } finally {
            setMinting(false);
        }
    };

    const handleTransfer = async (tokenId: number) => {
        if (!recipient) {
            toast.error("Please enter a recipient address");
            return;
        }
        const toastId = toast.loading(`Transferring #${tokenId}...`);
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const contract = new ethers.Contract(contractsConfig.nftAddress, ContractABIs.AssetNFT, signer);

            const tx = await contract.transferFrom(address, recipient, tokenId);
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("Transfer Successful", { description: `NFT #${tokenId} sent to ${recipient.slice(0, 6)}...` });

            setTransferringId(null);
            setRecipient("");
            fetchNFTs();
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Transfer Failed", { description: error.reason || error.message });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Art Gallery</h1>
                    <p className="text-gray-500 mt-2">Curated Collection of Digital Masterpieces</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-400 uppercase">Available to Mint</p>
                    <div className="flex gap-2 mt-2">
                        {Object.keys(ART_IMAGES).map((art) => (
                            <button
                                key={art}
                                onClick={() => handleBuy(art)}
                                disabled={minting || available[art] === false}
                                className={cn(
                                    "px-4 py-2 text-sm rounded-lg transition-colors",
                                    available[art] === false
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                )}
                            >
                                {available[art] === false ? "Sold Out" : `Buy "${art.split(" #")[0]}"`}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Price: 0.001 ETH</p>
                </div>
            </div>

            {loading ? (
                <p>Loading collection...</p>
            ) : nfts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    You don't own any Art yet. Mint one above!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {nfts.map((nft) => (
                        <div key={nft.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                            <div className="aspect-square bg-gray-200 relative">
                                <img
                                    src={ART_IMAGES[nft.uri] || "https://placehold.co/400x400?text=Art"}
                                    alt={nft.uri}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    {transferringId === nft.id ? (
                                        <div className="bg-white p-4 rounded-lg w-3/4 space-y-2">
                                            <input
                                                className="w-full p-2 text-sm border rounded"
                                                placeholder="Recipient 0x..."
                                                value={recipient}
                                                onChange={e => setRecipient(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTransfer(nft.id)} className="flex-1 bg-blue-600 text-white text-sm py-1 rounded">Confirm</button>
                                                <button onClick={() => setTransferringId(null)} className="flex-1 bg-gray-200 text-gray-800 text-sm py-1 rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setTransferringId(nft.id)}
                                            className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:scale-105 transition"
                                        >
                                            Transfer
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg truncate">{nft.uri}</h3>
                                <p className="text-sm text-gray-500">Token ID: #{nft.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
