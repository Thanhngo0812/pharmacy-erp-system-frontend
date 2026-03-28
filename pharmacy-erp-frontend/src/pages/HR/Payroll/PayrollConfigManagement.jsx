import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../../store/AuthContext";
import { AuthService } from "../../../services/AuthService";
import LoadingSpinnerMini from "../../../components/LoadingSpinner/LoadingSpinnerMini";
import { toast } from "react-toastify";
import "./PayrollConfigManagement.scss";

const FIXED_CONFIG_KEYS = [
    "BHXH_RATE_EMPLOYEE",
    "BHYT_RATE_EMPLOYEE",
    "BHTN_RATE_EMPLOYEE",
    "INSURANCE_BASE_CAP",
    "PERSONAL_DEDUCTION",
    "DEPENDENT_DEDUCTION_PER_PERSON"
];

const now = new Date();
const defaultMonth = now.getMonth() + 1;
const defaultYear = now.getFullYear();

const getApiData = (res, fallback) => {
    if (res && typeof res === "object" && Object.prototype.hasOwnProperty.call(res, "data")) {
        return res.data ?? fallback;
    }
    return res ?? fallback;
};

const getErrMessage = (error, fallback) => error?.response?.data?.message || fallback;

const formatDate = (value) => {
    if (!value) return "---";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
    if (!value) return "---";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("vi-VN");
};

const PayrollConfigManagement = ({ embedded = false }) => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.roles?.includes("ROLE_ADMIN");

    const [month, setMonth] = useState(defaultMonth);
    const [year, setYear] = useState(defaultYear);

    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editModal, setEditModal] = useState({
        isOpen: false,
        loading: false,
        id: null,
        configKey: "",
        configValue: "",
        description: ""
    });

    const [versionApiEnabled, setVersionApiEnabled] = useState(true);
    const [selectedVersionKey, setSelectedVersionKey] = useState(FIXED_CONFIG_KEYS[0]);
    const [versions, setVersions] = useState([]);
    const [effectiveVersion, setEffectiveVersion] = useState(null);
    const [versionLoading, setVersionLoading] = useState(false);
    const [versionError, setVersionError] = useState(null);

    const [versionDetailModal, setVersionDetailModal] = useState({
        isOpen: false,
        loading: false,
        data: null
    });

    const isPastPeriod = useMemo(() => {
        const nowDate = new Date();
        const currentYear = nowDate.getFullYear();
        const currentMonth = nowDate.getMonth() + 1;
        return year < currentYear || (year === currentYear && month < currentMonth);
    }, [month, year]);

    const orderedConfigs = useMemo(() => {
        const map = new Map((configs || []).map((item) => [item.configKey, item]));
        const ordered = FIXED_CONFIG_KEYS
            .map((key) => map.get(key))
            .filter(Boolean);

        const unknown = (configs || []).filter((item) => !FIXED_CONFIG_KEYS.includes(item.configKey));
        return [...ordered, ...unknown];
    }, [configs]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const configsRes = await AuthService.getPayrollConfigs();

            const cfgData = getApiData(configsRes, []);

            setConfigs(Array.isArray(cfgData) ? cfgData : []);
        } catch (error) {
            toast.error(getErrMessage(error, "Không thể tải Payroll Config"));
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    const loadVersionData = useCallback(async () => {
        if (!versionApiEnabled || !selectedVersionKey) {
            return;
        }

        setVersionLoading(true);
        setVersionError(null);
        try {
            const [timelineResult, effectiveResult] = await Promise.allSettled([
                AuthService.getPayrollConfigVersions({ configKey: selectedVersionKey }),
                AuthService.getPayrollConfigVersionEffective({ configKey: selectedVersionKey, month, year })
            ]);

            let unsupportedApi = false;

            if (timelineResult.status === "fulfilled") {
                const timeline = getApiData(timelineResult.value, []);
                setVersions(Array.isArray(timeline) ? timeline : []);
            } else {
                const status = timelineResult.reason?.response?.status;
                if (status === 405) {
                    unsupportedApi = true;
                } else {
                    setVersions([]);
                    setVersionError(getErrMessage(timelineResult.reason, "Không thể tải timeline version."));
                }
            }

            if (effectiveResult.status === "fulfilled") {
                const effective = getApiData(effectiveResult.value, null);
                setEffectiveVersion(effective || null);
            } else {
                const status = effectiveResult.reason?.response?.status;
                if (status === 405) {
                    unsupportedApi = true;
                } else if (status === 404) {
                    // 404 ở effective thường là chưa có version phù hợp cho kỳ/chỉ số, không phải thiếu API.
                    setEffectiveVersion(null);
                } else {
                    setEffectiveVersion(null);
                    setVersionError((prev) => prev || getErrMessage(effectiveResult.reason, "Không thể tải version đang áp dụng."));
                }
            }

            if (unsupportedApi) {
                setVersionApiEnabled(false);
                setVersions([]);
                setEffectiveVersion(null);
                setVersionError("Backend hiện chưa mở API version/effective.");
            }
        } catch (error) {
            setVersionError(getErrMessage(error, "Không thể tải dữ liệu version."));
        } finally {
            setVersionLoading(false);
        }
    }, [selectedVersionKey, month, year, versionApiEnabled]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (versionApiEnabled) {
            loadVersionData();
        }
    }, [loadVersionData, versionApiEnabled]);

    const openEditModal = async (configId) => {
        if (!isAdmin || isPastPeriod) return;

        setEditModal({
            isOpen: true,
            loading: true,
            id: configId,
            configKey: "",
            configValue: "",
            description: ""
        });

        try {
            const res = await AuthService.getPayrollConfigById(configId);
            const data = getApiData(res, null);
            if (!data) {
                throw new Error("Không có dữ liệu");
            }

            setEditModal({
                isOpen: true,
                loading: false,
                id: data.id,
                configKey: data.configKey || "",
                configValue: data.configValue != null ? String(data.configValue) : "",
                description: data.description || ""
            });
        } catch (error) {
            toast.error(getErrMessage(error, "Không thể lấy chi tiết chỉ số."));
            setEditModal({
                isOpen: false,
                loading: false,
                id: null,
                configKey: "",
                configValue: "",
                description: ""
            });
        }
    };

    const closeEditModal = () => {
        setEditModal({
            isOpen: false,
            loading: false,
            id: null,
            configKey: "",
            configValue: "",
            description: ""
        });
    };

    const handleUpdateConfig = async (e) => {
        e.preventDefault();
        if (!isAdmin || !editModal.id) return;

        if (isPastPeriod) {
            toast.warning(`Kỳ ${month}/${year} là kỳ cũ, không thể sửa chỉ số.`);
            return;
        }

        if (!String(editModal.configValue).trim()) {
            toast.warning("Vui lòng nhập giá trị chỉ số.");
            return;
        }

        setSaving(true);
        try {
            await AuthService.updatePayrollConfig(
                editModal.id,
                {
                    configValue: Number(editModal.configValue),
                    description: editModal.description || null
                },
                month,
                year
            );
            toast.success("Cập nhật chỉ số thành công cho kỳ đã chọn.");
            closeEditModal();
            loadData();
            if (versionApiEnabled) {
                loadVersionData();
            }
        } catch (error) {
            toast.error(getErrMessage(error, "Cập nhật chỉ số thất bại."));
        } finally {
            setSaving(false);
        }
    };

    const openVersionDetail = async (versionId) => {
        if (!versionApiEnabled || !versionId) return;

        setVersionDetailModal({ isOpen: true, loading: true, data: null });
        try {
            const res = await AuthService.getPayrollConfigVersionById(versionId);
            const data = getApiData(res, null);
            setVersionDetailModal({ isOpen: true, loading: false, data: data || null });
        } catch (error) {
            toast.error(getErrMessage(error, "Không thể lấy chi tiết version."));
            setVersionDetailModal({ isOpen: false, loading: false, data: null });
        }
    };

    return (
        <div className={`payroll-config-container ${embedded ? "embedded" : ""}`}>
            <div className="page-header">
                <h2>Quản lý Payroll Config</h2>
                <p>Chỉ có 6 chỉ số cố định. Sửa theo kỳ tháng/năm, backend tự lưu version để giữ nguyên lịch sử tháng cũ.</p>
            </div>

            <div className="period-bar">
                <div className="field">
                    <label>Tháng hiệu lực</label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Năm hiệu lực</label>
                    <input
                        type="number"
                        value={year}
                        min={2000}
                        max={2100}
                        onChange={(e) => setYear(Number(e.target.value))}
                    />
                </div>
                <button className="btn-refresh" onClick={loadData} disabled={loading || saving}>Tải dữ liệu</button>
            </div>

            {isPastPeriod && (
                <div className="version-warning">Kỳ cũ: chỉ xem, không được sửa chỉ số.</div>
            )}

            <div className="table-card">
                {loading ? (
                    <div className="loading-wrap">
                        <LoadingSpinnerMini fullScreen={false} text="Đang tải 6 chỉ số..." />
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="config-table">
                            <thead>
                                <tr>
                                    <th>Config key</th>
                                    <th>Giá trị</th>
                                    <th>Mô tả</th>
                                    <th>Cập nhật</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderedConfigs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty">Không có dữ liệu config</td>
                                    </tr>
                                ) : (
                                    orderedConfigs.map((item) => (
                                        <tr key={item.id}>
                                            <td className="key">{item.configKey}</td>
                                            <td>{item.configValue != null ? Number(item.configValue).toLocaleString("vi-VN", { maximumFractionDigits: 6 }) : "---"}</td>
                                            <td>{item.description || "---"}</td>
                                            <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "---"}</td>
                                            <td className="actions">
                                                <button
                                                    onClick={() => openEditModal(item.id)}
                                                    disabled={!isAdmin || isPastPeriod || saving}
                                                    title={
                                                        !isAdmin
                                                            ? "Chỉ Admin được sửa"
                                                            : isPastPeriod
                                                                ? "Kỳ cũ không được sửa chỉ số"
                                                                : "Sửa chỉ số"
                                                    }
                                                >
                                                    Sửa
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="version-card">
                <div className="version-header">
                    <h3>Lịch sử version (timeline)</h3>
                    <div className="version-actions">
                        <select value={selectedVersionKey} onChange={(e) => setSelectedVersionKey(e.target.value)}>
                            {FIXED_CONFIG_KEYS.map((key) => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                        {versionApiEnabled && (
                            <button className="btn-refresh" onClick={loadVersionData} disabled={versionLoading || saving}>Tải version</button>
                        )}
                    </div>
                </div>

                {!versionApiEnabled && (
                    <div className="version-warning">Backend hiện chưa mở API version/effective/detail trên nhánh này.</div>
                )}

                {versionApiEnabled && versionError && <div className="version-warning">{versionError}</div>}

                {versionApiEnabled && effectiveVersion && (
                    <div className="effective-box">
                        <div className="effective-title">Version đang áp dụng cho {month}/{year}</div>
                        <div className="effective-content">
                            <span>Version: {effectiveVersion.versionNo ?? effectiveVersion.version ?? "---"}</span>
                            <span>Giá trị: {effectiveVersion.configValue != null ? Number(effectiveVersion.configValue).toLocaleString("vi-VN", { maximumFractionDigits: 6 }) : "---"}</span>
                            <span>Từ: {formatDate(effectiveVersion.effectiveFrom)}</span>
                            <span>Đến: {formatDate(effectiveVersion.effectiveTo)}</span>
                        </div>
                    </div>
                )}

                {versionApiEnabled && (
                    <div className="table-responsive">
                        {versionLoading ? (
                            <div className="loading-wrap">
                                <LoadingSpinnerMini fullScreen={false} text="Đang tải timeline version..." />
                            </div>
                        ) : (
                            <table className="config-table version-table">
                                <thead>
                                    <tr>
                                        <th>Version</th>
                                        <th>Giá trị</th>
                                        <th>Hiệu lực từ</th>
                                        <th>Hiệu lực đến</th>
                                        <th>Tạo lúc</th>
                                        <th>Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {versions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="empty">Chưa có timeline version cho chỉ số này</td>
                                        </tr>
                                    ) : (
                                        versions
                                            .sort((a, b) => {
                                                const dateA = a?.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
                                                const dateB = b?.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0;
                                                if (dateB !== dateA) return dateB - dateA;
                                                return Number(b.versionNo || b.version || 0) - Number(a.versionNo || a.version || 0);
                                            })
                                            .map((item) => (
                                                <tr key={item.id || `${item.versionNo || item.version}-${item.effectiveFrom || ""}`}>
                                                    <td>{item.versionNo ?? item.version ?? "---"}</td>
                                                    <td>{item.configValue != null ? Number(item.configValue).toLocaleString("vi-VN", { maximumFractionDigits: 6 }) : "---"}</td>
                                                    <td>{formatDate(item.effectiveFrom)}</td>
                                                    <td>{formatDate(item.effectiveTo)}</td>
                                                    <td>{formatDateTime(item.createdAt || item.updatedAt)}</td>
                                                    <td className="actions">
                                                        <button onClick={() => openVersionDetail(item.id)} disabled={!item.id}>Xem</button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {editModal.isOpen && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Sửa chỉ số Payroll Config</h3>
                            <button className="btn-close" onClick={closeEditModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {editModal.loading ? (
                                <LoadingSpinnerMini fullScreen={false} text="Đang tải chi tiết..." />
                            ) : (
                                <form className="edit-form" onSubmit={handleUpdateConfig}>
                                    <div className="field">
                                        <label>Config key</label>
                                        <input type="text" value={editModal.configKey} disabled />
                                    </div>
                                    <div className="field">
                                        <label>Giá trị mới cho kỳ {month}/{year}</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={editModal.configValue}
                                            onChange={(e) => setEditModal((prev) => ({ ...prev, configValue: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Mô tả</label>
                                        <input
                                            type="text"
                                            value={editModal.description}
                                            onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="secondary" onClick={closeEditModal}>Hủy</button>
                                        <button type="submit" disabled={saving || isPastPeriod}>Lưu theo kỳ</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {versionDetailModal.isOpen && (
                <div className="modal-overlay" onClick={() => setVersionDetailModal({ isOpen: false, loading: false, data: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết version</h3>
                            <button className="btn-close" onClick={() => setVersionDetailModal({ isOpen: false, loading: false, data: null })}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {versionDetailModal.loading ? (
                                <LoadingSpinnerMini fullScreen={false} text="Đang tải version..." />
                            ) : (
                                <div className="version-detail">
                                    <div><strong>Config key:</strong> {versionDetailModal.data?.configKey || selectedVersionKey}</div>
                                    <div><strong>Version:</strong> {versionDetailModal.data?.versionNo ?? versionDetailModal.data?.version ?? "---"}</div>
                                    <div><strong>Giá trị:</strong> {versionDetailModal.data?.configValue != null ? Number(versionDetailModal.data.configValue).toLocaleString("vi-VN", { maximumFractionDigits: 6 }) : "---"}</div>
                                    <div><strong>Hiệu lực từ:</strong> {formatDate(versionDetailModal.data?.effectiveFrom)}</div>
                                    <div><strong>Hiệu lực đến:</strong> {formatDate(versionDetailModal.data?.effectiveTo)}</div>
                                    <div><strong>Tạo lúc:</strong> {formatDateTime(versionDetailModal.data?.createdAt || versionDetailModal.data?.updatedAt)}</div>
                                    <div><strong>Mô tả:</strong> {versionDetailModal.data?.description || "---"}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollConfigManagement;
