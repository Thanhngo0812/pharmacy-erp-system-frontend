import { Link, Navigate } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1 style={{ color: "black" }}>Error 404: Page Not Found!</h1>
      <Link to="/admin" replace>
        <span
          style={{
            marginTop: "20px",
            color: "blue",
            textDecorationLine: "underline",
            fontSize: "19px",
            display: "inline-block",
          }}
        >
          Quay trở lại trang chủ?
        </span>
      </Link>
    </div>
  );
}
