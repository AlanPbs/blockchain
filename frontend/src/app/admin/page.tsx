"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import contractsConfig from '@/lib/contracts-config.json';
import { ContractABIs } from '@/lib/contracts';
import { toast } from 'sonner';

export default function AdminPage() {
    const [targetAddress, setTargetAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const getContract = async () => {
        if (typeof (window as any).ethereum === "undefined") throw new Error("No Wallet");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(contractsConfig.complianceAddress, ContractABIs.ComplianceRegistry, signer);
    };

    const handleWhitelist = async () => {
        if (!targetAddress) return;
        setLoading(true);
        const toastId = toast.loading("Whitelisting user...");
        try {
            const contract = await getContract();
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
            const contract = await getContract();
            // Assuming revokeAccess is implemented as 'addToBlacklist' or similar based on contract code
            // Checking contract code: function addToBlacklist(address _account) external onlyOwner
            // Wait, we used 'addToBlacklist' in ComplianceRegistry.sol
            const tx = await contract.addToBlacklist(targetAddress);
            // Note: ContractABIs needs to include this function
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-500 mt-2">Manage KYC compliance and platform settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Whitelist Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Compliance Management</h2>
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

                {/* Oracle Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Oracle Updates</h2>
                    <p className="text-sm text-gray-500 mb-4">Update asset prices manually (Admin only).</p>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded-md" placeholder="Asset Symbol (e.g. REF)" />
                        <input className="w-full p-2 border rounded-md" placeholder="Price (USD)" />
                        <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                            Update Price
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
