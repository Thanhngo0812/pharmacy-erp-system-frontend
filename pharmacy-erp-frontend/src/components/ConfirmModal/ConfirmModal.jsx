import React from "react";
import "./ConfirmModal.scss";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
  showInput = false,
  inputValue = "",
  onInputChange = () => { },
  inputPlaceholder = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay confirm-modal-overlay">
      <div className="modal-content">
        <div className={`modal-header ${type}`}>
          {/* Icon cảnh báo tùy theo loại */}
          {type === "danger" ? (
            <span className="modal-icon">🔒</span>
          ) : (
            <span className="modal-icon">🔓</span>
          )}
          <h3>{title}</h3>
        </div>

        <div className="modal-body">
          <p>{message}</p>
          {/* Khu vực nhập lý do (nếu có) */}
          {showInput && (
            <textarea
              className="modal-input"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder || "Nhập lý do..."}
              rows={3}
            />
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            className={`btn-confirm ${type}`}
            onClick={onConfirm}
            // Disable nút Confirm nếu có input mà chưa nhập gì
            disabled={showInput && !inputValue.trim()}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;