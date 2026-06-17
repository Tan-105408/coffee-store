// Utility: Lấy token từ localStorage và tạo funciton apiFetch cho các request
const token = localStorage.getItem("token");

const apiFetch = async (url, options = {}) => {
  // Các header mặc định là JSON
  const defaultHeaders = {
    "Content-Type": "application/json"
  };

  // Nếu token tồn tại và không có header Authorization nào, thêm nó
  if (token && !options.headers?.Authorization) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Gộp các header
  const headers = { ...defaultHeaders, ...options.headers };

  return fetch(url, { ...options, headers });
};

// ================= LẤY THÔNG TIN NGƯỜI DÙNG =================
if (token) {
  apiFetch("/auth/profile", { method: "GET" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Không thể xác thực người dùng.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Người dùng:", data);
      const profileBox = document.getElementById("profile");
      if (profileBox) {
        profileBox.innerText = JSON.stringify(data, null, 2);
      }
    })
    .catch((error) => {
      console.error("Lỗi xác thực:", error.message);
    });
} else {
  console.warn("Chưa có token. Vui lòng đăng nhập.");
}

// ================= THÊM VÀO GIỎ HÀNG =================
// Dùng event delegation để tránh gán nhiều listener hoặc trùng lặp
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const button = e.target;
    const productId = button.getAttribute("data-id");
    
    // Kiểm tra nếu ở trang chi tiết có input quantity
    const quantityInput = document.getElementById("quantity");
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (!productId) {
      console.error("ProductId không xác định");
      return;
    }

    try {
      const response = await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Đã thêm sản phẩm vào giỏ!");
        // Nếu đang ở trang chi tiết thì chuyển hướng về giỏ hàng luôn cho tiện
        if (window.location.pathname.includes("/api/products/")) {
           window.location.href = "/cart";
        }
      } else {
        alert(data.message || "Lỗi khi thêm sản phẩm vào giỏ.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi thêm sản phẩm.");
      console.error(error);
    }
  }
});

// ================= XÓA SẢN PHẨM KHỎI GIỎ =================
document.querySelectorAll(".remove-item").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const productId = e.target.getAttribute("data-id");
    if (!productId) {
      console.error("ProductId không xác định khi xóa");
      return;
    }
    try {
      const response = await apiFetch(`/cart/remove/${productId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        alert("Đã xóa sản phẩm khỏi giỏ!");
        window.location.reload();
      } else {
        alert(data.message || "Lỗi khi xóa sản phẩm khỏi giỏ.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa sản phẩm.");
      console.error(error);
    }
  });
});

// ================= XEM CHI TIẾT SẢN PHẨM =================
// Đã chuyển sang trang chi tiết riêng, không dùng modal nữa
