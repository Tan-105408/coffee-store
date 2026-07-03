// Utility: Lấy token từ localStorage và tạo function apiFetch cho các request
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

// Helper: Hiển thị thông báo SweetAlert2 chuyên nghiệp
const showToast = (message, icon = 'success') => {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      text: message,
      icon: icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      iconColor: icon === 'success' ? '#2a9d8f' : '#e76f51',
      background: '#fff',
      color: '#2b221e',
      customClass: {
        popup: 'shadow-lg rounded-3 border-0'
      }
    });
  } else {
    alert(message);
  }
};

const showModalAlert = (title, text, icon = 'success') => {
  if (typeof Swal !== 'undefined') {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonColor: '#5c3e35',
      background: '#fdfbf7',
      color: '#2b221e',
      customClass: {
        popup: 'rounded-4 border-0 shadow-lg',
        confirmButton: 'co-btn co-btn-primary px-4'
      }
    });
  } else {
    alert(text);
    return Promise.resolve();
  }
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
  const button = e.target.closest(".add-to-cart");
  if (button) {
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
        showToast("Đã thêm sản phẩm vào giỏ hàng thành công!");
        // Nếu đang ở trang chi tiết thì chuyển hướng về giỏ hàng sau 1 giây cho mượt mà
        if (window.location.pathname.includes("/api/products/")) {
          setTimeout(() => {
            window.location.href = "/cart";
          }, 1200);
        }
      } else {
        showToast(data.message || "Lỗi khi thêm sản phẩm vào giỏ.", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra khi thêm sản phẩm.", "error");
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

    if (typeof Swal !== 'undefined') {
      const confirmation = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e76f51',
        cancelButtonColor: '#7d706a',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ',
        background: '#fdfbf7',
        color: '#2b221e',
        customClass: {
          popup: 'rounded-4 border-0 shadow-lg',
          confirmButton: 'co-btn px-4',
          cancelButton: 'co-btn px-4'
        }
      });

      if (!confirmation.isConfirmed) return;
    } else {
      if (!confirm("Bạn có muốn xóa sản phẩm khỏi giỏ?")) return;
    }

    try {
      const response = await apiFetch(`/cart/remove/${productId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Đã xóa sản phẩm khỏi giỏ hàng!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showToast(data.message || "Lỗi khi xóa sản phẩm khỏi giỏ.", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra khi xóa sản phẩm.", "error");
      console.error(error);
    }
  });
});
