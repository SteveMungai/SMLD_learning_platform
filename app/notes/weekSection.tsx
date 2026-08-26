import type { Week, Material } from "@prisma/client";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type WeekWithMaterials = Week & { materials: Material[] };

export function WeekSection({ week }: { week: WeekWithMaterials }) {
  const video = week.materials.find((m) => m.type === "VIDEO");
  const documents = week.materials.filter((m) => m.type !== "VIDEO");
  const embedUrl = video ? getYouTubeEmbedUrl(video.fileUrl) : null;

  return (
    <details className="border-b py-4">
      <summary className="cursor-pointer font-medium">
        Week {week.weekNumber}: {week.topic}
      </summary>

      <div className="mt-4 space-y-4">
        {video && (
          embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-red-600 text-sm">Invalid video link.</p>
          )
        )}

        {documents.length > 0 && (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={`/api/materials/${doc.id}/download`}
                  className="text-blue-600 hover:underline"
                >
                  {doc.title} ({doc.type})
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}