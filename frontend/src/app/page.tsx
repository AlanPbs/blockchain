"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { cn } from "@/lib/utils";
import contractsConfig from '@/lib/contracts-config.json';
import { ContractABIs } from '@/lib/contracts';
import { toast } from 'sonner';
import { PriceChart } from '@/components/PriceChart';

type TradeEvent = {
    id: number;
    buyer?: string;
    seller?: string;
    amount: string;
    timestamp: number;
};

export default function Home() {
    const [balance, setBalance] = useState("0");
    const [ethBalance, setEthBalance] = useState("0");
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Market Data
    const [goldPrice, setGoldPrice] = useState("0");
    const [artFloor, setArtFloor] = useState("0.001"); // Fixed value from NFT contract

    // Transfer State
    const [recipient, setRecipient] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);

    // Indexer State
    const [recentTrades, setRecentTrades] = useState<TradeEvent[]>([]);

    const fetchData = async () => {
        if (typeof (window as any).ethereum === "undefined") {
            setLoading(false);
            return;
        }
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Contracts
            const compliance = new ethers.Contract(contractsConfig.complianceAddress, ContractABIs.ComplianceRegistry, signer);
            const token = new ethers.Contract(contractsConfig.tokenAddress, ContractABIs.AssetToken, signer);
            const oracle = new ethers.Contract(contractsConfig.oracleAddress, ContractABIs.AssetOracle, signer);

            // Parallel Fetch
            const [verified, tokenBalance, ethBal, gldPriceWei] = await Promise.all([
                compliance.isVerified(address),
                token.balanceOf(address),
                provider.getBalance(address),
                oracle.getPrice("GLD")
            ]);

            setIsWhitelisted(verified);
            setBalance(ethers.formatEther(tokenBalance));
            setEthBalance(ethers.formatEther(ethBal));
            setGoldPrice(ethers.formatEther(gldPriceWei));

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchIndexerData = async () => {
        try {
            const res = await fetch("http://localhost:3001/stats");
            if (res.ok) {
                const data = await res.json();
                setRecentTrades(data.trades || []);
            }
        } catch (e) {
            console.error("Indexer fetch failed", e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchIndexerData();
        const interval = setInterval(() => {
            fetchData();
            fetchIndexerData();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTransfer = async () => {
        if (!recipient || !transferAmount) {
            toast.error("Please fill in all fields");
            return;
        }
        setTransferLoading(true);
        const toastId = toast.loading("Processing Transfer...");

        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(contractsConfig.tokenAddress, ContractABIs.AssetToken, signer);

            const tx = await token.transfer(recipient, ethers.parseEther(transferAmount));
            await tx.wait();

            toast.dismiss(toastId);
            toast.success("Transfer Successful!", { description: `Sent ${transferAmount} GLD to ${recipient.slice(0, 6)}...` });

            setRecipient("");
            setTransferAmount("");
            fetchData();
        } catch (error: any) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Transfer Failed", { description: error.reason || error.message });
        } finally {
            setTransferLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 🚀 MARKET TICKER */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800">
                {/* ... existing ticker content ... */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <span className="text-2xl">🥇</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Gold (GLD) Price</p>
                            <p className="text-xl font-mono font-bold text-yellow-500">
                                {goldPrice} ETH <span className="text-xs text-slate-500">/ 1 GLD</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <span className="text-2xl">🖼️</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Art Floor Price</p>
                            <p className="text-xl font-mono font-bold text-purple-400">
                                {artFloor} ETH
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 border-l border-slate-700 pl-4 pr-4">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Market Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-bold text-green-400">LIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📈 PRICE CHART */}
            <PriceChart />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Compliance Card */}
                <div className={cn(
                    "p-6 rounded-xl shadow-sm border transition-all",
                    isWhitelisted ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account Status</h2>
                    <div className="mt-4 flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", isWhitelisted ? "bg-green-500" : "bg-red-500")} />
                        <span className={cn("text-xl font-bold", isWhitelisted ? "text-green-700" : "text-red-700")}>
                            {isWhitelisted ? 'Verified Trader' : 'Unverified'}
                        </span>
                    </div>
                </div>

                {/* Portfolio Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Your Portfolio</h2>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Gold Holdings</span>
                            <span className="font-bold text-xl text-yellow-600">{parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-gray-400">GLD</span></span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500">ETH Balance</span>
                            <span className="font-bold text-lg">{parseFloat(ethBalance).toFixed(4)} <span className="text-sm text-gray-400">ETH</span></span>
                        </div>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center gap-3">
                    <a href="/trade" className="w-full text-center py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all">
                        🚀 Trade GLD
                    </a>
                    <a href="/gallery" className="w-full text-center py-3 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all">
                        🎨 View Gallery
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transfer Section */}
                <section className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span>💸</span> Quick Transfer
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-medium">RECIPIENT</label>
                            <input
                                type="text"
                                placeholder="0x..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm relative z-10"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium">AMOUNT (GLD)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold relative z-10 min-w-0"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                />
                                <button
                                    onClick={handleTransfer}
                                    disabled={transferLoading}
                                    className="bg-slate-900 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                    {transferLoading ? "..." : "Send"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live Market Section */}
                <section className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span>📊</span> Live Market Activity
                        </h2>
                        <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                            ● Connected to Indexer
                        </span>
                    </div>

                    <div className="overflow-hidden">
                        {recentTrades.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-400 italic">Waiting for new trades...</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentTrades.map((trade) => (
                                        <tr key={trade.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-bold",
                                                    trade.buyer ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {trade.buyer ? "BUY ORDER" : "SELL ORDER"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium">
                                                {parseFloat(ethers.formatEther(trade.amount)).toFixed(2)} GLD
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-400 text-sm">
                                                {new Date(trade.timestamp).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
