import React from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const UserDistributionChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No data available for visualization
            </div>
        );
    }

    // Format data for Recharts if needed
    const chartData = data.map(item => ({
        name: item.displayName || item.name,
        value: item.count
    })).filter(item => item.value > 0);

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <PieChart>
                    <defs>
                        {COLORS.map((color, index) => (
                            <linearGradient key={`grad-${index}`} id={`colorPie-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={5}
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#colorPie-${index % COLORS.length})`} stroke={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                            border: '1px solid #444',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default UserDistributionChart;
