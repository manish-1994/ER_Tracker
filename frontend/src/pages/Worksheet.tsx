import React from "react";
import { useParams } from "react-router-dom";

// Placeholder Worksheet component. Replace with actual implementation.
const Worksheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Worksheet Detail</h2>
      <p>Worksheet ID: {id}</p>
      {/* TODO: Add real worksheet content */}
    </div>
  );
};

export default Worksheet;
