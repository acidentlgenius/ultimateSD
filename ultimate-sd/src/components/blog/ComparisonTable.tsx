import { ComparisonBlock } from "@/lib/blog";

export function ComparisonTable({ block }: { block: ComparisonBlock }) {
  return (
    <div className="my-8 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      {block.title && (
        <div className="border-b bg-muted/50 px-4 py-3 font-semibold">
          {block.title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              {block.headers.map((header, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {block.rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/20">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${
                      j === 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
