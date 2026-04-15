// apps/desktop/src/components/app/dashboard-charts.tsx
import * as React from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell,
    PieChart,
    Pie
} from "recharts";

const data = [
    { name: "Jan", revenue: 4000, expense: 2400 },
    { name: "Feb", revenue: 3000, expense: 1398 },
    { name: "Mar", revenue: 2000, expense: 9800 },
    { name: "Apr", revenue: 2780, expense: 3908 },
    { name: "May", revenue: 1890, expense: 4800 },
    { name: "Jun", revenue: 2390, expense: 3800 },
    { name: "Jul", revenue: 3490, expense: 4300 },
];

const pieData = [
    { name: "Operating", value: 400 },
    { name: "Marketing", value: 300 },
    { name: "Payroll", value: 300 },
    { name: "Utilities", value: 200 },
];

const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b"];

export function RevenueChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            borderColor: "hsl(var(--border))", 
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ExpenseDistribution() {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        cornerRadius={4}
                        dataKey="value"
                    >
                        {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
