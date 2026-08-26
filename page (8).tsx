import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/db";
import { deleteDocumentAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  bloodwork: "Bloodwork",
  imaging: "Imaging / scans",
  genetics: "Genetic test",
  report: "Medical report",
  other: "Other"
};

export default async function DocumentsPage({ searchParams }: { searchParams: { uploaded?: string; error?: string } }) {
  const user = await requireUser("CLIENT");
  const docs = listDocuments(user.id);

  return (
    <Shell user={user} active="documents">
      <h1>My documents</h1>
      <p className="muted">
        Upload lab results, imaging reports or other files to share with your coach. Files stay on this
        computer — nothing is sent to any cloud service.
      </p>

      {searchParams.uploaded && <div className="alert ok">File uploaded.</div>}
      {searchParams.error && <div className="alert error">{searchParams.error}</div>}

      <div className="card" style={{ maxWidth: 560 }}>
        <h2>Upload a document</h2>
        <form action="/api/documents" method="post" encType="multipart/form-data">
          <label htmlFor="file">File (PDF or image, up to 20 MB)</label>
          <input id="file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" />
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue="other">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="btn">Upload</button>
        </form>
      </div>

      <div className="card">
        <h2>Your files</h2>
        {docs.length === 0 ? (
          <p className="muted">No documents yet. Your uploads will appear here.</p>
        ) : (
          <table>
            <thead>
              <tr><th>File</th><th>Category</th><th>Uploaded</th><th>Size</th><th /></tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td><a href={`/api/documents/${d.id}`} target="_blank">{d.filename}</a></td>
                  <td><span className="pill amber">{CATEGORY_LABELS[d.category] ?? d.category}</span></td>
                  <td className="muted">{d.uploadedAt.slice(0, 10)}</td>
                  <td className="muted">{(d.size / 1024 / 1024).toFixed(1)} MB</td>
                  <td>
                    <form action={deleteDocumentAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn danger small">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
