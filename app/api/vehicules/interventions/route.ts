// Alias route to support older client code still calling /api/vehicules/interventions.
// Next.js requires `runtime`/`dynamic` to be exported from this file (not re-exported).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { GET, POST } from "../../interventions/route";
