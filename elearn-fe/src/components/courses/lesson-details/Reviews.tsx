import Image from "next/image";

interface ReviewUser {
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

interface Review {
  _id: string;
  rate: number;
  comment: string;
  title: string;
  date: string;
  userId: ReviewUser;
}

import img_1 from "@/assets/img/courses/review-author.png";

interface ReviewsProps {
  feedback: Review[];
}

const Reviews = ({ feedback }: ReviewsProps) => {
  // Calculate rating distribution
  const ratingDistribution = Array(5).fill(0);
  feedback.forEach((review) => {
    ratingDistribution[Math.floor(review.rate) - 1]++;
  });

  const sortedFeedback = [...feedback].sort((a, b) => b.rate - a.rate);

  const totalReviews = feedback.length;
  const averageRating =
    totalReviews > 0
      ? feedback.reduce((acc, review) => acc + review.rate, 0) / totalReviews
      : 0;

  return (
    <div className="courses__rating-wrap" style={{ paddingBottom: "40px" }}>
      <h2 className="title">Reviews</h2>
      <div className="course-rate" style={{ marginBottom: "40px" }}>
        <div className="course-rate__summary">
          <div className="course-rate__summary-value">
            {averageRating.toFixed(1)}
          </div>
          <div className="course-rate__summary-stars">
            {[...Array(5)].map((_, index) => (
              <i
                key={index}
                className={`fas fa-star${
                  index < averageRating ? "" : " text-gray-300"
                }`}
                style={{
                  color: index < averageRating ? "#F8BC24" : "#D1D5DB",
                }}
              />
            ))}
          </div>
          <div className="course-rate__summary-text">
            {totalReviews} Ratings
          </div>
        </div>
        <div className="course-rate__details">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="course-rate__details-row">
              <div
                className="course-rate__details-row-star"
                style={{ display: "flex", alignItems: "center" }}
              >
                <div style={{ width: "15px" }}>{stars}</div>
                <i className="fas fa-star" style={{ color: "#F8BC24" }}></i>
              </div>
              <div className="course-rate__details-row-value">
                <div className="rating-gray"></div>
                <div
                  className="rating"
                  style={{
                    width: `${
                      totalReviews > 0
                        ? (ratingDistribution[stars - 1] / totalReviews) * 100
                        : 0
                    }%`,
                  }}
                  title={`${
                    totalReviews > 0
                      ? (
                          (ratingDistribution[stars - 1] / totalReviews) *
                          100
                        ).toFixed(0)
                      : 0
                  }%`}
                ></div>
                <span className="rating-count">
                  {ratingDistribution[stars - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sortedFeedback.map((review) => (
        <div
          className="course-review-head courses__rating-wrap"
          key={review._id}
          style={{
            marginBottom: "0px",
            marginTop: "30px",
          }}
        >
          <div className="review-author-thumb">
            <Image
              src={review.userId.avatarUrl || "/assets/img/avatar-default.png"}
              width={120}
              height={120}
              alt={`${review.userId.firstName} ${review.userId.lastName}`}
              style={{
                borderRadius: "50%",
                boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div
            className="review-author-content"
            style={{ flex: 1, minWidth: 0 }}
          >
            <div
              className="author-name"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 className="name">
                {review.userId.firstName} {review.userId.lastName}{" "}
                <span>{new Date(review.date).toLocaleDateString()}</span>
              </h5>
              <div className="author-rating">
                {[...Array(5)].map((_, index) => (
                  <i
                    key={index}
                    className="fas fa-star"
                    style={{
                      color: index < review.rate ? "#F8BC24" : "#D1D5DB",
                    }}
                  />
                ))}
              </div>
            </div>
            <h4 className="title">{review.title}</h4>
            <p style={{ minHeight: "3em", wordBreak: "break-word" }}>
              {review.comment}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reviews;
