import { Link } from "react-router-dom";
import { FaRulerCombined } from "react-icons/fa";
import "./Product.scss";

export default function Product() {
    return (
        <div className="product-overview-container">
            <h2>Quản lý sản phẩm</h2>
            <p>
                Mục này là tab lớn quản lý sản phẩm. Để quản trị quy đổi cấp bậc đơn vị,
                vui lòng vào tab con Đơn vị.
            </p>

            <Link to="/admin/product/units" className="goto-unit-btn">
                <FaRulerCombined />
                Mở tab Đơn vị
            </Link>
        </div>
    );
}