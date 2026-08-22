import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// ─── Seed file URLs ──────────────────────────────────────────────────────────
// Framework library URLs are already hardcoded inside importFrameworkLibrary.
// Other seed URLs will be configured as the bundled data files become available.
// To enable a library, set its URL below to the public media URL of the seed
// Excel file. Re-running the seed function will amend existing records (for the
// Framework Library, which is idempotent) or add new records for others.
const SEED_FILES: Record<string, string> = {
  risk_library: "",
  control_library: "",
  ihpom_library: "",
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const libraries: string[] = body?.libraries;
    if (!Array.isArray(libraries) || libraries.length === 0) {
      return Response.json({ error: 'libraries array required' }, { status: 400 });
    }

    const results: Record<string, any> = {};

    for (const lib of libraries) {
      try {
        if (lib === 'framework_library') {
          const res = await base44.functions.invoke('importFrameworkLibrary', {});
          const data = res?.data ?? res;
          results[lib] = data?.error ? { status: 'error', message: data.error } : { status: 'success', detail: data };
        } else if (lib === 'risk_library' || lib === 'control_library' || lib === 'ihpom_library') {
          const fileUrl = SEED_FILES[lib];
          if (!fileUrl) {
            results[lib] = {
              status: 'not_configured',
              message: `Seed file URL not yet configured. Set SEED_FILES.${lib} in the seedLibraries function to enable this library.`,
            };
          } else {
            const fnName = lib === 'risk_library' ? 'importRiskLibrary'
              : lib === 'control_library' ? 'importControlLibrary'
              : 'importIHPOMNodes';
            const res = await base44.functions.invoke(fnName, { file_url: fileUrl });
            const data = res?.data ?? res;
            results[lib] = data?.error ? { status: 'error', message: data.error } : { status: 'success', detail: data };
          }
        } else {
          results[lib] = { status: 'error', message: `Unknown library: ${lib}` };
        }
      } catch (err: any) {
        results[lib] = { status: 'error', message: err?.message || String(err) };
      }
    }

    return Response.json({ status: 'success', results });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}