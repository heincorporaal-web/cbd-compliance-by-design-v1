import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CIClassManager({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const { data: classes = [] } = useQuery({ queryKey: ["ciClasses"], queryFn: () => base44.entities.CIClass.list("sort_order", 500) });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.CIClass.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["ciClasses"]); setNewName(""); setNewCode(""); toast.success("CI class added"); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.CIClass.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(["ciClasses"]),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CIClass.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["ciClasses"]); toast.success("CI class deleted"); },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim(), code: newCode.trim() || newName.trim().toLowerCase().replace(/\s+/g, "_"), sort_order: 500, is_system: false, is_active: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manage CI Classes</DialogTitle></DialogHeader>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input placeholder="Class name (e.g. Load Balancer)" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="code" className="w-32" value={newCode} onChange={e => setNewCode(e.target.value)} />
          <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /></Button>
        </form>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {classes.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400 font-mono">{c.code}{c.is_system && " · system"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={c.is_active} onCheckedChange={(v) => toggleMut.mutate({ id: c.id, is_active: v })} disabled={c.is_system} />
                {!c.is_system && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}