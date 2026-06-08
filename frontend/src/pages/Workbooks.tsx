import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

/** Cyber‑punk style workbooks listing page */
const Workbooks = () => {
  const fetchWorkbooks = async () => {
    // The baseURL already includes '/api', so we only need '/workbooks'
    const { data } = await api.get("/workbooks");
    return data;
  };

  const { data, isLoading, error } = useQuery({ queryKey: ["workbooks"], queryFn: fetchWorkbooks });

  if (isLoading) return <div className="p-6 text-gray-200">Loading workbooks...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load workbooks</div>;

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0a0f1a] p-6">
      <h1 className="text-3xl font-bold text-cyan-300 mb-6 text-center">Workbooks</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((wb: any) => (
              <motion.div
                key={wb.id}
                className="bg-black/50 backdrop-blur-lg p-4 rounded border border-cyan-500/30"
                whileHover={{ scale: 1.03 }}
              >
                <h2 className="text-xl font-medium text-cyan-200 mb-2">{wb.name}</h2>
                <p className="text-gray-300">
                  Uploaded at: {new Date(wb.uploaded_at).toLocaleString()}
                </p>
              </motion.div>
            ))}
      </div>
    </section>
  );
};

export default Workbooks;
