import { motion } from "motion/react";

export default function SkeletonChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-24 ml-auto animate-pulse" />
      </div>

      <div className="flex items-end justify-between gap-2 h-64 mb-4 px-4 border-l border-b border-gray-50">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: "10%" }}
            animate={{ 
              height: [
                `${Math.random() * 40 + 20}%`, 
                `${Math.random() * 40 + 40}%`, 
                `${Math.random() * 40 + 20}%`
              ] 
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
            className="bg-emerald-50 rounded-t w-full min-w-[8px]"
          />
        ))}
      </div>

      <div className="flex justify-between gap-4 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-2 bg-gray-100 rounded w-10 animate-pulse" />
        ))}
      </div>
      
      <div className="h-3 bg-gray-50 rounded w-64 mt-8 animate-pulse" />
    </div>
  );
}
