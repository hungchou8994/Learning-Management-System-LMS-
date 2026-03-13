import MarkdownViewer from "@/components/common/MarkdownViewer";

interface LessonInfo {
  title: string;
  duration: number;
  type: "video" | "document" | "online";
}

interface OverviewProps {
  description: string;
  lessonInfo: LessonInfo;
}

const Overview = ({ description, lessonInfo }: OverviewProps) => {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "fas fa-play-circle";
      case "document":
        return "fas fa-file-alt";
      default:
        return "fas fa-globe";
    }
  };

  return (
    <div className="courses__overview-wrap">
      <div
        className="lesson-header"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2 className="title" style={{ marginBottom: "0px" }}>
          {lessonInfo.title}
        </h2>
        <div
          className="lesson-meta"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            marginTop: "0px",
          }}
        >
          <span className="duration">
            <i className="far fa-clock"></i> {lessonInfo.duration} minutes
          </span>
          <span className="type">
            <i className={getContentTypeIcon(lessonInfo.type)}></i>{" "}
            {lessonInfo.type.charAt(0).toUpperCase() + lessonInfo.type.slice(1)}
          </span>
        </div>
      </div>

      <div className="lesson-content">
        <h3 className="title">Lesson Description</h3>
        <MarkdownViewer markdown={description} />
      </div>
    </div>
  );
};

export default Overview;
