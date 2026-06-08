import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { name: "Jan", uv: 400 },
  { name: "Feb", uv: 300 },
  { name: "Mar", uv: 200 },
  { name: "Apr", uv: 278 },
  { name: "May", uv: 189 },
];

/** Cyber‑punk styled dashboard */
const Dashboard = () => {
  return (
    <section className="min-h-screen bg-[#070B14] text-gray-100 p-6">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block bg-black/60 backdrop-blur-md border-r border-cyan-500/30">
          <nav className="flex flex-col p-4 space-y-4">
            <a href="/" className="text-cyan-400 hover:text-cyan-300">Dashboard</a>
            <a href="/workbooks" className="text-cyan-400 hover:text-cyan-300">Workbooks</a>
            <a href="/profile" className="text-cyan-400 hover:text-cyan-300">Profile</a>
          </nav>
        </aside>
        <main className="flex-1 ml-0 md:ml-4">
          {/* Top Nav */}
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-cyan-300">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <input type="text" placeholder="Search..." className="px-3 py-1 rounded bg-gray-800 text-gray-200 focus:outline-none" />
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
            </div>
          </header>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { title: "Users", value: 1234 },
              { title: "Sessions", value: 5678 },
              { title: "Revenue", value: "$9,876" },
            ].map((card) => (
              <motion.div
                key={card.title}
                className="bg-black/50 backdrop-blur-lg p-4 rounded border border-cyan-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <h2 className="text-lg font-medium text-cyan-200 mb-2">{card.title}</h2>
                <p className="text-2xl font-bold text-cyan-400">{card.value}</p>
              </motion.div>
            ))}
          </div>
          {/* Chart */}
          <div className="bg-black/50 backdrop-blur-lg p-4 rounded border border-cyan-500/30 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#00ffff" />
                <YAxis stroke="#00ffff" />
                <Tooltip />
                <Line type="monotone" dataKey="uv" stroke="#00ffff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;
