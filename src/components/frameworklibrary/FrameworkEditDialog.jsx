import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Layers, GitBranch } from "lucide-react";
import FrameworkMetadataEditor from "./FrameworkMetadataEditor";
import FrameworkPillarsEditor from "./FrameworkPillarsEditor";
import FrameworkNodesEditor from "./FrameworkNodesEditor";

export default function FrameworkEditDialog({ open, framework, pillars, nodes, nodeTypes, onClose, onChanged }) {
  const [tab, setTab] = React.useState("metadata");
  React.useEffect(() => { if (open) setTab("metadata"); }, [open]);
  if (!framework) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Edit framework — {framework.name}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="self-start">
            <TabsTrigger value="metadata"><Settings className="w-4 h-4 mr-1" /> Details</TabsTrigger>
            <TabsTrigger value="pillars"><Layers className="w-4 h-4 mr-1" /> Pillars</TabsTrigger>
            <TabsTrigger value="hierarchy"><GitBranch className="w-4 h-4 mr-1" /> Hierarchy</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto pr-1 mt-3 min-h-0">
            <TabsContent value="metadata" className="mt-0"><FrameworkMetadataEditor framework={framework} onSaved={onChanged} /></TabsContent>
            <TabsContent value="pillars" className="mt-0"><FrameworkPillarsEditor frameworkId={framework.id} frameworkName={framework.name} pillars={pillars} onChanged={onChanged} /></TabsContent>
            <TabsContent value="hierarchy" className="mt-0"><FrameworkNodesEditor frameworkId={framework.id} nodes={nodes} nodeTypes={nodeTypes} onChanged={onChanged} /></TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}