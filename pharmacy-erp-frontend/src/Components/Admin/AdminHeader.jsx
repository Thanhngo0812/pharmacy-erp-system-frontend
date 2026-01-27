import "../scss/AdminHeader.scss";
import { FaBars } from "react-icons/fa";

export default function AdminHeader({ toggleSidebar }) {
  return (
    <div className="header-container">
      <FaBars className="icon-fabars" onClick={toggleSidebar} />
    </div>
  );
}
