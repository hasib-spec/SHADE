import React from 'react';
import { motion } from 'framer-motion';
import { FiCpu } from 'react-icons/fi';

/**
 * Animated indicator showing agent tool usage (e.g. "Running knapsack solver...")
 */
const ToolCallIndicator = ({ tool }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-[#0B0F19] border border-shade-accent/30 rounded text-shade-accent w-fit"
    >
      <FiCpu className="animate-spin-slow" />
      <span className="text-xs font-mono text-glow">Executing: {tool}() ...</span>
    </motion.div>
  );
};

export default ToolCallIndicator;
