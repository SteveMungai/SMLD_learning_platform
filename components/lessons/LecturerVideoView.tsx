import VideoEmbed from "./VideoEmbed";
import SectionLink from "./SectionLink";
import AddVideoForm from "./AddVideoForm";

export default function LecturerVideoView({ lessonId, video }: { lessonId: string; video: { title: string; link: string } | null }) {
  return (
    <>
      <VideoEmbed video={video} emptyText="No video yet — add one below." />
      <AddVideoForm lessonId={lessonId} hasVideo={!!video} />
      <SectionLink href={`/lessons/${lessonId}/notes`}>Notes</SectionLink>
    </>
  );
}
