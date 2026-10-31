import VideoEmbed from "./VideoEmbed";
import SectionLink from "./SectionLink";

export default function StudentVideoView({ lessonId, video }: { lessonId: string; video: { title: string; link: string } | null }) {
  return (
    <>
      <VideoEmbed video={video} emptyText="Your lecturer hasn’t added a video for this lesson yet." />
      <SectionLink href={`/lessons/${lessonId}/notes`}>Notes</SectionLink>
    </>
  );
}
