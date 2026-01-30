"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

const generateData = () => {
    const data = [];
    let price = 0.01;
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Past 24h
        // Random walk
        const change = (Math.random() - 0.5) * 0.0005;
        price += change;
        if (price < 0.005) price = 0.005; // Floor

        data.push({
            time: time.getHours() + ":00",
            price: price.toFixed(5),
            fullDate: time.toLocaleString()
        });
    }
    return data;
};

export function PriceChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        setData(generateData());
    }, []);

    return (
        <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Price History (GLD/ETH)</h3>
                    <p className="text-xs text-green-500 font-medium">+1.24% (24h)</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded text-gray-600">24H</span>
                    <span className="px-2 py-1 text-xs font-medium bg-white text-gray-400">1W</span>
                    <span className="px-2 py-1 text-xs font-medium bg-white text-gray-400">1M</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 30,
                    }}
                >
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        minTickGap={30}
                        dy={10}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickFormatter={(value) => `Ξ${value}`}
                        width={50}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} ETH`, 'Price']}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
