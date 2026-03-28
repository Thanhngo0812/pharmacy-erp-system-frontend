import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaBoxOpen } from "react-icons/fa";
import { UnitService } from "../../services/UnitService";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import LoadingSpinnerMini from "../LoadingSpinner/LoadingSpinnerMini";
import "./UnitManagement.scss";

const defaultForm = {
  id: null,
  unitName: "",
  level: "",
};

const UnitManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    usageStatus: "",
  });

  const [formModal, setFormModal] = useState({
    isOpen: false,
    isEdit: false,
  });
  const [formData, setFormData] = useState(defaultForm);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    unit: null,
    title: "",
    message: "",
    type: "danger",
  });

  const extractErrorMessage = (error, fallback) => {
    const apiData = error?.response?.data;
    return apiData?.message || apiData?.error || error?.message || fallback;
  };

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await UnitService.getUnits();
      const payload = Array.isArray(response) ? response : (response?.data || []);
      const normalized = payload.map((item) => ({
        ...item,
        inUse: Boolean(item?.inUse),
      }));
      setUnits(normalized);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Không thể tải danh sách đơn vị."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const sortedUnits = useMemo(() => {
    const filtered = units.filter((unit) => {
      const matchKeyword = (unit.unitName || "")
        .toLowerCase()
        .includes(filters.keyword.trim().toLowerCase());

      const matchUsage =
        filters.usageStatus === ""
          ? true
          : filters.usageStatus === "in_use"
            ? !!unit.inUse
            : !unit.inUse;

      return matchKeyword && matchUsage;
    });

    return filtered.sort((a, b) => Number(a.level) - Number(b.level));
  }, [units, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilter = () => {
    setFilters({ keyword: "", usageStatus: "" });
  };

  const openCreateModal = () => {
    setFormData(defaultForm);
    setFormModal({ isOpen: true, isEdit: false });
  };

  const openEditModal = (unit) => {
    if (unit.inUse) {
      toast.warning("Đơn vị này đã gắn sản phẩm, không thể chỉnh sửa.");
      return;
    }

    setFormData({
      id: unit.id,
      unitName: unit.unitName || "",
      level: unit.level?.toString() || "",
    });
    setFormModal({ isOpen: true, isEdit: true });
  };

  const closeFormModal = () => {
    setFormModal({ ...formModal, isOpen: false });
    setFormData(defaultForm);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const unitName = formData.unitName.trim();
    const level = Number(formData.level);

    if (!unitName) {
      toast.warning("Vui lòng nhập tên đơn vị.");
      return;
    }

    if (!Number.isInteger(level) || level <= 0) {
      toast.warning("Level phải là số nguyên lớn hơn 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (formModal.isEdit && formData.id != null) {
        await UnitService.updateUnit(formData.id, { unitName, level });
        toast.success("Cập nhật đơn vị thành công.");
      } else {
        await UnitService.createUnit({ unitName, level });
        toast.success("Tạo đơn vị mới thành công.");
      }
      closeFormModal();
      fetchUnits();
    } catch (error) {
      const message = extractErrorMessage(error, "Không thể lưu đơn vị.");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (unit) => {
    setConfirmModal({
      isOpen: true,
      unit,
      type: "danger",
      title: "CẢNH BÁO XÓA ĐƠN VỊ",
      message: `Bạn đang chuẩn bị XÓA vĩnh viễn đơn vị \"${unit.unitName}\" (level ${unit.level}). Hành động này ảnh hưởng đến quy đổi tồn kho và không thể hoàn tác.`,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleDelete = async () => {
    if (!confirmModal.unit) return;

    const target = confirmModal.unit;
    closeDeleteConfirm();

    try {
      await UnitService.deleteUnit(target.id);
      toast.success("Đã xóa đơn vị thành công.");
      fetchUnits();
    } catch (error) {
      const message = extractErrorMessage(error, "Không thể xóa đơn vị.");
      toast.error(`Xóa bị chặn: ${message}`);
    }
  };

  const getUsageStatus = (unit) => {
    if (unit.inUse) {
      return {
        label: "Đang được sử dụng",
        className: "in-use",
      };
    }

    return {
      label: "Có thể cập nhật",
      className: "available",
    };
  };

  if (loading && units.length === 0) {
    return (
      <div className="loading-overlay">
        <LoadingSpinnerMini fullScreen={false} text="Đang tải danh sách đơn vị..." />
      </div>
    );
  }

  return (
    <div className="unit-list-container">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {formModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-form-modal">
            <div className="modal-header">
              <h3>{formModal.isEdit ? "Sửa đơn vị" : "Tạo mới đơn vị"}</h3>
            </div>
            <form onSubmit={submitForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên đơn vị</label>
                  <input
                    type="text"
                    value={formData.unitName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unitName: e.target.value }))}
                    placeholder="Ví dụ: Vỉ, Hộp, Thùng..."
                    maxLength={50}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Level</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.level}
                    onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                    placeholder="Ví dụ: 1, 2, 3..."
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeFormModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý đơn vị tính</h2>
          <p>
            Danh sách đơn vị luôn được hiển thị theo level tăng dần để người dùng nắm đúng thứ bậc quy đổi.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/product" className="btn-back">
            <FaBoxOpen />
            Về sản phẩm
          </Link>
          <button className="btn-add" onClick={openCreateModal}>
            <FaPlus />
            Tạo mới đơn vị
          </button>
        </div>
      </div>



      <div className="filter-card">
        <div className="filter-form">
          <div className="filter-group">
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Tìm theo tên đơn vị..."
            />
          </div>

          <div className="filter-group">
            <select name="usageStatus" value={filters.usageStatus} onChange={handleFilterChange}>
              <option value="">-- Tất cả trạng thái dùng --</option>
              <option value="available">Có thể cập nhật</option>
              <option value="in_use">Đang được sử dụng</option>
            </select>
          </div>

          <div className="filter-group sort-fixed">
            <input value="Sắp xếp: Level tăng dần" readOnly />
          </div>

          <button className="btn-reset" onClick={handleResetFilter}>
            Đặt lại
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="unit-table">
            <thead>
              <tr>
                <th>Tên đơn vị</th>
                <th>Level</th>
                <th>Trạng thái dùng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedUnits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">Chưa có dữ liệu đơn vị.</td>
                </tr>
              ) : (
                sortedUnits.map((unit) => {
                  const status = getUsageStatus(unit);
                  const isBlocked = !!unit.inUse;

                  return (
                    <tr key={unit.id}>
                      <td className="name-col">{unit.unitName}</td>
                      <td className="level-col">{unit.level}</td>
                      <td>
                        <span className={`status-badge ${status.className}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(unit)}
                            disabled={isBlocked}
                            title={isBlocked ? "Đơn vị đã gắn sản phẩm, không thể sửa" : "Sửa đơn vị"}
                          >
                            <FaEdit /> Sửa
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => openDeleteConfirm(unit)}
                            title="Xóa đơn vị"
                          >
                            <FaTrash /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnitManagement;
