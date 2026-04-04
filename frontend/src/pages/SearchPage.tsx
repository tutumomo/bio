import { Dna, Network, Microscope } from "lucide-react";
import { motion } from "motion/react";
import { SearchBar } from "@/components/SearchBar";

export function SearchPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <section className="relative rounded-[2rem] overflow-hidden p-12 lg:p-20 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="absolute inset-0 z-0 bg-[#002045]" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-tight">
            Navigate the <span className="text-blue-200">Human Interactome</span>
          </h1>
          <p className="text-blue-100/80 text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Search genes and proteins to generate paper-quality variant annotation tables with CADD, GERP++, and RegulomeDB scores.
          </p>

          <SearchBar />

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { label: "NCBI", icon: <Microscope className="w-3 h-3" /> },
              { label: "Ensembl VEP", icon: <Dna className="w-3 h-3" /> },
              { label: "RegulomeDB", icon: <Network className="w-3 h-3" /> },
            ].map((db) => (
              <span
                key={db.label}
                className="flex items-center gap-2 bg-white/10 text-white border border-white/10 px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
              >
                {db.icon}
                {db.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
