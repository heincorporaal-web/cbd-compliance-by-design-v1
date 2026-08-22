import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Shield, TriangleAlert, ClipboardCheck, Network, Database,
  Loader2, CheckCircle2, AlertCircle, Download, Info, RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LIBRARIES = [
  {
    key: "framework_library",
    name: "Master Framework Library",
    description: "COBIT, ISO 27001, DORA, NIST CSF — framework nodes, pillars, and node types. Idempotent: re-running updates existing records.",
    icon: Shield,
    configured: true,
    countFn: async () => {
      const items = await base44.entities.Framework.filter({ is_master: true }, "-created_date", 500);
      return items.length;
    },
    countLabel: "master frameworks",
  },
  {
    key: "risk_library",
    name: "Master Risk Library",
    description: "Pre-defined library risk statements with likelihood, impact, and root cause classifications.",
    icon: TriangleAlert,
    configured: false,
    countFn: async () => {
      const items = await base44.entities.Risk.filter({ is_library_risk: true }, "-created_date", 500);
      return items.length;
    },
    countLabel: "library risks",
  },
  {
    key: "control_library",
    name: "Master Control Library",
    description: "Pre-defined library controls mapped to frameworks with control types, frequencies, and criticality.",
    icon: ClipboardCheck,
    configured: false,
    countFn: async () => {
      const items = await base44.entities.Control.filter({ is_library_control: true }, "-created_date", 500);
      return items.length;
    },
    countLabel: "library controls",
  },
  {
    key: "ihpom_library",
    name: "iHPOM Node Library",
    description: "Integrated Hierarchical Process Object Model — process taxonomy nodes and hierarchy.",
    icon: Network,
    configured: false,
    countFn: async () => {
      const items = await base44.entities.IHPOMNode.list("-created_date", 500);
      return items.length;
    },
    countLabel: "iHPOM nodes",
  },
];

export default function SeedLibraries() {
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: counts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ["seedLibraryCounts"],
    queryFn: async () => {
      const entries = await Promise.all(
        LIBRARIES.map(async (lib) => [lib.key, await lib.countFn()])
      );
      return Object.fromEntries(entries);
    },
    staleTime: 30000,
  });

  const toggleLib = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSeed = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const response = await base44.functions.invoke("seedLibraries", {
        libraries: Array.from(selected),
      });
      const data = response?.data ?? response;
      setResults(data?.results || {});
      if (data?.status === "success") {
        toast({ title: "Seeding complete", description: "Selected libraries have been processed." });
      } else {
        toast({ title: "Seeding completed with warnings", description: "Check the results below.", variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["seedLibraryCounts"] });
    } catch (err) {
      toast({ title: "Seeding failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seeded Library Maintenance</h1>
          <p className="text-sm text-slate-500">
            Load and update pre-defined master libraries bundled with CBD.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-medium">About Seeded Libraries</p>
          <p>
            CBD ships with pre-defined master libraries for frameworks, risks, controls, and
            process models. These are maintained centrally and amended with major version
            upgrades. Tick the libraries you want to load or update, then click the button below.
          </p>
        </div>
      </div>

      {/* Library cards */}
      <div className="space-y-3">
        {LIBRARIES.map((lib) => {
          const count = counts[lib.key] ?? null;
          const isLoaded = count != null && count > 0;
          const result = results?.[lib.key];
          const isSelected = selected.has(lib.key);

          return (
            <Card
              key={lib.key}
              className={`border-2 transition-colors ${isSelected ? "border-primary" : "border-slate-200"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleLib(lib.key)}
                    className="mt-1"
                  />
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      lib.configured ? "bg-indigo-100" : "bg-slate-100"
                    }`}
                  >
                    <lib.icon className={`w-5 h-5 ${lib.configured ? "text-indigo-600" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{lib.name}</h3>
                      {isLoaded ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Loaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          Not Loaded
                        </Badge>
                      )}
                      {!lib.configured && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          Seed file pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{lib.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      {countsLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : count != null ? (
                        <span>
                          {count} {lib.countLabel}
                        </span>
                      ) : null}
                    </div>

                    {/* Result display */}
                    {result && (
                      <div
                        className={`mt-3 p-2.5 rounded-md text-xs flex items-start gap-1.5 ${
                          result.status === "not_configured"
                            ? "bg-amber-50 text-amber-700"
                            : result.status === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {result.status === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            {result.status === "success" && "Loaded successfully"}
                            {result.status === "not_configured" && "Not configured"}
                            {result.status === "error" && "Error"}
                          </p>
                          {result.message && <p className="mt-0.5">{result.message}</p>}
                          {result.detail && result.status === "success" && (
                            <p className="mt-0.5 text-green-600">
                              {result.detail.status === "success" && result.detail.nodes != null
                                ? `${result.detail.nodes} nodes, ${result.detail.frameworks} frameworks, ${result.detail.pillars} pillars`
                                : "Records processed."}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4 -mx-4 md:-mx-6 rounded-b-lg">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            {selected.size} librar{selected.size === 1 ? "y" : "ies"} selected
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["seedLibraryCounts"] })}
            disabled={countsLoading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh counts
          </Button>
        </div>
        <Button
          onClick={handleSeed}
          disabled={loading || selected.size === 0}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Load Selected Libraries
            </>
          )}
        </Button>
      </div>
    </div>
  );
}