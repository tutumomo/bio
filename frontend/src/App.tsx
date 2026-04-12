import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SearchPage } from "@/pages/SearchPage";
import { ResultsPage } from "@/pages/ResultsPage";
import { GeneDetailPage } from "@/pages/GeneDetailPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<SearchPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/gene/:geneSymbol" element={<GeneDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
