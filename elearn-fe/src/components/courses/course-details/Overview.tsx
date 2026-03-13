interface OverviewProps {
  description: string;
  targets: string[];
  requirements: string[];
}

const Overview = ({ description, targets, requirements }: OverviewProps) => {
  return (
    <div className="courses__overview-wrap">
      <h3 className="title">Course Description</h3>
      <p>{description}</p>

      <h3 className="title" style={{ marginTop: "20px" }}>
        What you&apos;ll learn in this course?
      </h3>
      <ul className="about__info-list list-wrap">
        {targets.map((target, index) => (
          <li key={index} className="about__info-list-item">
            <i className="flaticon-angle-right"></i>
            <p className="content">{target}</p>
          </li>
        ))}
      </ul>

      {requirements.length > 0 && (
        <>
          <h3 className="title" style={{ marginTop: "20px" }}>
            Course Requirements
          </h3>
          <ul className="about__info-list list-wrap">
            {requirements.map((requirement, index) => (
              <li key={index} className="about__info-list-item">
                <i className="flaticon-angle-right"></i>
                <p className="content">{requirement}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Overview;
