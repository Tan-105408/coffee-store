// Utility: API fetch using session cookies (no Bearer token needed)
const apiFetch = async (url, options = {}) => {
  const defaultHeaders = { "Accept": "application/json" };
  if (options.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }
  const headers = { ...defaultHeaders, ...options.headers };
  return fetch(url, { ...options, headers, credentials: "same-origin" });
};

// Helper: Toast notification
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
      iconColor: icon === 'success' ? '#3D8B6E' : '#D4663C',
      background: '#fff',
      color: '#1E1410',
      customClass: { popup: 'shadow-lg rounded-3 border-0' }
    });
  } else {
    alert(message);
  }
};

const showModalAlert = (title, text, icon = 'success') => {
  if (typeof Swal !== 'undefined') {
    return Swal.fire({
      title, text, icon,
      confirmButtonColor: '#4A2C2A',
      background: '#FAF7F2',
      color: '#1E1410',
      customClass: { popup: 'rounded-4 border-0 shadow-lg', confirmButton: 'co-btn co-btn-primary px-4' }
    });
  } else {
    alert(text);
    return Promise.resolve();
  }
};

// ================= ADD TO CART =================
document.addEventListener("click", async (e) => {
  const button = e.target.closest(".add-to-cart");
  if (button) {
    const productId = button.getAttribute("data-id");
    const quantityInput = document.getElementById("quantity");
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (!productId) { console.error("ProductId not defined"); return; }

    try {
      const response = await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Đã thêm vào giỏ hàng!");
        if (window.location.pathname.includes("/api/products/")) {
          setTimeout(() => { window.location.href = "/cart"; }, 1200);
        }
      } else {
        showToast(data.message || "Lỗi khi thêm sản phẩm.", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra.", "error");
      console.error(error);
    }
  }
});

// ================= REMOVE FROM CART =================
document.querySelectorAll(".remove-item").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const productId = e.target.getAttribute("data-id");
    if (!productId) { console.error("ProductId not defined"); return; }

    if (typeof Swal !== 'undefined') {
      const confirmation = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: "Xóa sản phẩm khỏi giỏ hàng?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#D4663C',
        cancelButtonColor: '#8C7E74',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        background: '#FAF7F2',
        color: '#1E1410',
        customClass: { popup: 'rounded-4 border-0 shadow-lg', confirmButton: 'co-btn px-4', cancelButton: 'co-btn px-4' }
      });
      if (!confirmation.isConfirmed) return;
    } else {
      if (!confirm("Xóa sản phẩm khỏi giỏ?")) return;
    }

    try {
      const response = await apiFetch(`/cart/remove/${productId}`, { method: "DELETE" });
      const data = await response.json();
      if (response.ok) {
        showToast("Đã xóa khỏi giỏ hàng!");
        setTimeout(() => { window.location.reload(); }, 1000);
      } else {
        showToast(data.message || "Lỗi khi xóa.", "error");
      }
    } catch (error) {
      showToast("Có lỗi xảy ra.", "error");
      console.error(error);
    }
  });
});
