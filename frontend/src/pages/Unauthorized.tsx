import React from "react";
import { Link } from "react-router-dom";

const Unauthorized: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
        <p className="mb-6">You do not have permission to view this page.</p>
        <Link to="/" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
