import { getYouTubeEmbedUrl } from "@/lib/youtube";

export default function VideoEmbed({ video, emptyText }: { video: { title: string; link: string } | null; emptyText: string }) {
  if (!video) {
    return (
      <div className="aspect-video max-w-xl mx-auto rounded-lg flex items-center justify-center text-sm" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}>
        {emptyText}
      </div>
    );
  }
  const embedUrl = getYouTubeEmbedUrl(video.link);
  if (!embedUrl) return <p className="text-sm text-red-600">This video link couldn&apos;t be loaded.</p>;
  return (
    <figure className="max-w-xl mx-auto">
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe src={embedUrl} title={video.title} className="w-full h-full" allowFullScreen />
      </div>
      <figcaption className="text-xs mt-2" style={{ color: "#6b7280" }}>{video.title}</figcaption>
    </figure>
  );
}
