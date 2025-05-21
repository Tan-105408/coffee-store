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
  apiFetch("http://127.0.0.1:3030/auth/profile", { method: "GET" })
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
document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const productId = e.target.getAttribute("data-id");
    if (!productId) {
      console.error("ProductId không xác định");
      return;
    }
    try {
      const response = await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Đã thêm sản phẩm vào giỏ!");
      } else {
        alert(data.message || "Lỗi khi thêm sản phẩm vào giỏ.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi thêm sản phẩm.");
      console.error(error);
    }
  });
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
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("product-modal");
  const modalImage = document.getElementById("modal-image");
  const modalName = document.getElementById("modal-name");
  const modalPrice = document.getElementById("modal-price");
  const modalQuantity = document.getElementById("modal-quantity");
  const modalAddToCart = document.getElementById("modal-add-to-cart");
  let currentProductId = null;

  // Xử lý sự kiện xem chi tiết trên từng sản phẩm
  document.querySelectorAll(".view-details").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-name");
      const price = parseFloat(button.getAttribute("data-price"));
      const discount = parseFloat(button.getAttribute("data-discount"));
      const image = button.getAttribute("data-image");
      currentProductId = button.getAttribute("data-id");

      const finalPrice =
        discount > 0
          ? (price * (1 - discount / 100)).toFixed(0)
          : price.toFixed(0);

      modalImage.src = image;
      modalName.textContent = name;
      modalPrice.innerHTML =
        discount > 0
          ? `Giá gốc: <del>${price} VND</del><br>Giá giảm: ${finalPrice} VND`
          : `Giá: ${finalPrice} VND`;

      modalQuantity.value = 1;
      modal.style.display = "flex";
    });
  });

  // Xử lý sự kiện thêm vào giỏ hàng từ modal
  modalAddToCart.addEventListener("click", async () => {
    const quantity = parseInt(modalQuantity.value);
    if (!currentProductId || isNaN(quantity) || quantity < 1) return;
    try {
      const response = await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({
          productId: currentProductId,
          quantity: quantity,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Đã thêm vào giỏ hàng!");
        closeModal();
      } else {
        alert(data.message || "Thêm giỏ hàng thất bại.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi thêm sản phẩm vào giỏ.");
    }
  });
});

// Hàm đóng Modal
function closeModal() {
  document.getElementById("product-modal").style.display = "none";
}
