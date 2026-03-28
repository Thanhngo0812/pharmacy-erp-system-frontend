export const getStoredToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.accessToken || null;
  } catch (error) {
    return null;
  }
};

export const getAuthHeader = () => {
  const token = getStoredToken();
  if (!token) throw new Error("Chưa đăng nhập");
  return { Authorization: `Bearer ${token}` };
};
