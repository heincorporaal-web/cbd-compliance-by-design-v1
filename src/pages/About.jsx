import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Info, Pencil, Save, ShieldCheck, Calendar, FileText, ScrollText, Mail, Send } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TERMS = "Compliance by Design Platform – User Terms\n\nEnter the user terms for the Compliance by Design Platform here.";
const DEFAULT_AUP = "Acceptable Use Policy\n\nEnter the Acceptable Use Policy here.";

export default function About() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState("about");
  const [form, setForm] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["appMeta"],
    queryFn: () => base44.entities.AppMeta.list("-updated_date", 1),
  });
  const meta = metas[0];

  useEffect(() => {
    if (meta) {
      setForm({
        app_name: meta.app_name || "",
        version: meta.version || "",
        release_date: meta.release_date || "",
        tagline: meta.tagline || "",
        description: meta.description || "",
        release_notes: meta.release_notes || "",
        user_terms: meta.user_terms || "",
        acceptable_use_policy: meta.acceptable_use_policy || "",
      });
    }
  }, [meta]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const data = { ...payload, last_updated_by: user?.full_name || user?.email || "admin" };
      if (meta) return base44.entities.AppMeta.update(meta.id, data);
      return base44.entities.AppMeta.create({ app_name: data.app_name || "GRC Platform", ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["appMeta"]);
      setEditing(false);
      toast.success("Information saved");
    },
    onError: (e) => toast.error("Failed to save: " + e.message),
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openEdit = (tab) => { setEditTab(tab); setEditing(true); };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
          <Info className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">About</h1>
          <p className="text-slate-500 text-sm">Application information, version & policies</p>
        </div>
      </div>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="legal">Terms &amp; Policy</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* ── About tab ─────────────────────────────────────────── */}
        <TabsContent value="about" className="mt-4">
          {isLoading ? (
            <div className="text-center text-slate-400 py-20">Loading…</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-700 px-6 py-8 text-white flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{meta?.app_name || "GRC Platform"}</h2>
                  {meta?.tagline && <p className="text-slate-200 text-sm mt-1">{meta.tagline}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {meta?.version && (
                    <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                      Version {meta.version}
                    </Badge>
                  )}
                  {isAdmin && (
                    <Button size="sm" onClick={() => openEdit("about")} variant="secondary" className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Version</p>
                      <p className="font-semibold text-slate-800">{meta?.version || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Release Date</p>
                      <p className="font-semibold text-slate-800">{meta?.release_date || "—"}</p>
                    </div>
                  </div>
                </div>
                {meta?.description && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{meta.description}</p>
                  </div>
                )}
                {meta?.release_notes && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Release Notes</p>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{meta.release_notes}</p>
                  </div>
                )}
                {meta?.last_updated_by && (
                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                    Last updated by {meta.last_updated_by}
                    {meta.updated_date && ` · ${new Date(meta.updated_date).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Terms & Policy tab ────────────────────────────────── */}
        <TabsContent value="legal" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-400 py-20">Loading…</div>
          ) : (
            <>
              <LegalCard
                icon={FileText}
                title="Compliance by Design Platform – User Terms"
                content={meta?.user_terms}
                isAdmin={isAdmin}
                onEdit={() => openEdit("legal")}
              />
              <LegalCard
                icon={ScrollText}
                title="Acceptable Use Policy"
                content={meta?.acceptable_use_policy}
                isAdmin={isAdmin}
                onEdit={() => openEdit("legal")}
              />
            </>
          )}
        </TabsContent>

        {/* ── Contact tab ──────────────────────────────────────── */}
        <TabsContent value="contact" className="mt-4">
          <ContactTab user={user} />
        </TabsContent>
      </Tabs>

      {/* ── Edit dialog ────────────────────────────────────────── */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editTab === "about" ? "About / Version" : "Terms & Policy"}</DialogTitle>
            <DialogDescription>
              {editTab === "about"
                ? "Set the version number and application details."
                : "Edit the User Terms and Acceptable Use Policy text manually."}
            </DialogDescription>
          </DialogHeader>

          {editTab === "about" ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>App Name</Label>
                  <Input value={form.app_name || ""} onChange={e => setField("app_name", e.target.value)} />
                </div>
                <div>
                  <Label>Version</Label>
                  <Input placeholder="v1.2" value={form.version || ""} onChange={e => setField("version", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Release Date</Label>
                <Input type="date" value={form.release_date || ""} onChange={e => setField("release_date", e.target.value)} />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={form.tagline || ""} onChange={e => setField("tagline", e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description || ""} onChange={e => setField("description", e.target.value)} />
              </div>
              <div>
                <Label>Release Notes</Label>
                <Textarea rows={4} value={form.release_notes || ""} onChange={e => setField("release_notes", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label>Compliance by Design Platform – User Terms</Label>
                <Textarea
                  rows={8}
                  placeholder={DEFAULT_TERMS}
                  value={form.user_terms || ""}
                  onChange={e => setField("user_terms", e.target.value)}
                />
              </div>
              <div>
                <Label>Acceptable Use Policy</Label>
                <Textarea
                  rows={8}
                  placeholder={DEFAULT_AUP}
                  value={form.acceptable_use_policy || ""}
                  onChange={e => setField("acceptable_use_policy", e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400">Line breaks are preserved. You can paste full policy text here.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" /> {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactTab({ user }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter a subject and a message.");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("submitContactRequest", {
        subject: subject.trim(),
        message: message.trim(),
        request_type: "activation",
      });
      toast.success("Your request has been sent to the product owner.");
      setSubject("");
      setMessage("");
    } catch (e) {
      toast.error("Failed to send request: " + (e?.message || "unknown error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Contact / Request Activation</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-500">
          Use this form to request activation of an add-on module (such as Third Party Risk Management)
          for your company, or to contact the product owner. Your name and email are included automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Your Name</Label>
            <Input value={user?.full_name || ""} disabled />
          </div>
          <div>
            <Label>Your Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
        </div>
        <div>
          <Label>Subject</Label>
          <Input
            placeholder="e.g. Request activation of Third Party Risk Management"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea
            rows={6}
            placeholder="Describe your request…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LegalCard({ icon: Icon, title, content, isAdmin, onEdit }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </div>
      <div className="p-6">
        {content ? (
          <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <p className="text-slate-400 text-sm italic">No content has been set yet. Click Edit to add this policy.</p>
        )}
      </div>
    </div>
  );
}