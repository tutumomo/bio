import React, { useMemo, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart3 } from "lucide-react";
import SkeletonChart from "./SkeletonChart";
import { ErrorState } from "./ErrorState";
import { useTheme } from "@/context/ThemeContext";

interface TissueExpressionChartProps {
  geneSymbol: string;
  ensemblId?: string;
}

const TissueExpressionChart: React.FC<TissueExpressionChartProps> = ({
  geneSymbol,
  ensemblId,
}) => {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(dark);
    };
    checkDark();
    
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["expression", geneSymbol],
    queryFn: () => api.getTissueExpression(geneSymbol, ensemblId),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const sortedData = useMemo(() => {
    if (!data?.expression) return [];
    return [...data.expression]
      .sort((a, b) => b.tpm - a.tpm)
      .slice(0, 30); // Show top 30 tissues for readability
  }, [data]);

  if (isLoading) {
    return <SkeletonChart />;
  }

  if (isError) {
    return (
      <div className="h-full">
        <ErrorState 
          error={error} 
          onRetry={() => refetch()} 
          title="Expression data error"
        />
      </div>
    );
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No expression data available for {geneSymbol}</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {payload[0].value.toFixed(2)} TPM
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Tissue Expression (GTEx)</h3>
        <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-auto">
          Units: Transcripts Per Million (TPM)
        </span>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDark ? "#1e293b" : "#f1f5f9"} 
            />
            <XAxis
              dataKey="tissue"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
              label={{
                value: "TPM",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                fill: isDark ? "#64748b" : "#94a3b8",
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1e293b' : '#f8fafc', opacity: 0.4 }} />
            <Bar dataKey="tpm" fill={isDark ? "#10b981" : "#059669"} radius={[4, 4, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? (isDark ? "#059669" : "#047857") : (isDark ? "#10b981" : "#059669")}
                  fillOpacity={0.8 + (1 - index / sortedData.length) * 0.2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 italic">
        * Showing top {sortedData.length} tissues with highest median expression.
      </p>
    </div>
  );
};

export default TissueExpressionChart;
