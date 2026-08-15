import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only delete control for an OrgProcess record.
 * Renders nothing for non-admins. Shows a confirmation dialog before
 * deleting and invalidates the process list query on success.
 */
export default function DeleteProcessButton({
  process,
  onDeleted,
  variant = "ghost",
  size = "icon",
  label,
  className = "",
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const btnSize = label ? size : "icon";

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.OrgProcess.delete(process.id),
    onSuccess: () => {
      queryClient.invalidateQueries(["orgProcesses"]);
      queryClient.invalidateQueries(["orgProcess"]);
      toast.success(`Process "${process.name || process.process_code}" deleted`);
      setOpen(false);
      onDeleted?.();
    },
    onError: (e) => toast.error("Delete failed: " + (e?.message || e)),
  });

  if (!isAdmin || !process?.id) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={btnSize}
        className={className}
        title="Delete process"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className={label ? "w-4 h-4 mr-1.5 text-red-500" : "w-4 h-4 text-red-500"} />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete process?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-slate-900">
                {process.name || process.process_code}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}