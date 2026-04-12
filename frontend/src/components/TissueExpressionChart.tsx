import React, { useMemo } from "react";
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
import { TissueExpressionEntry } from "@/types";
import { BarChart3, AlertCircle, Loader2 } from "lucide-react";

interface TissueExpressionChartProps {
  geneSymbol: string;
  ensemblId?: string;
}

const TissueExpressionChart: React.FC<TissueExpressionChartProps> = ({
  geneSymbol,
  ensemblId,
}) => {
  const { data, isLoading, isError, error } = useQuery({
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
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-slate-200">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-slate-500 text-sm font-medium">Loading expression data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-red-100">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-600 text-sm font-medium">Error loading expression</p>
        <p className="text-red-400 text-xs mt-1">{(error as Error)?.message || "Unknown error"}</p>
      </div>
    );
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-slate-200">
        <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-slate-500 text-sm font-medium">No expression data available for {geneSymbol}</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-xs font-medium text-emerald-600">
            {payload[0].value.toFixed(2)} TPM
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-800">Tissue Expression (GTEx)</h3>
        <span className="text-xs font-normal text-slate-400 ml-auto">
          Units: Transcripts Per Million (TPM)
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="tissue"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 10, fill: "#64748b" }}
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              label={{
                value: "TPM",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                fill: "#94a3b8",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tpm" fill="#059669" radius={[4, 4, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? "#047857" : "#059669"}
                  fillOpacity={0.8 + (1 - index / sortedData.length) * 0.2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-slate-400 mt-4 italic">
        * Showing top {sortedData.length} tissues with highest median expression.
      </p>
    </div>
  );
};

export default TissueExpressionChart;
