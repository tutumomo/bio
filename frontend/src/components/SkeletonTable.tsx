import { motion } from "motion/react";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export default function SkeletonTable({ rows = 8, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 h-12 flex items-center px-4 gap-4 border-b border-gray-100">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
            className="flex items-center px-4 py-4 gap-4"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-gray-100 rounded flex-1"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
