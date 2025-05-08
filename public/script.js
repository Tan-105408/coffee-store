document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      try {
        const response = await fetch("/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await response.json();
        if (data.success) {
          alert("Đã thêm sản phẩm vào giỏ!");
        } else {
          alert("Lỗi khi thêm sản phẩm vào giỏ.");
        }
      } catch (error) {
        alert("Có lỗi xảy ra!");
      }
    });
  });
  
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productId = e.target.getAttribute("data-id");
      try {
        const response = await fetch(`/cart/remove/${productId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (response.ok) {
          alert("Đã xóa sản phẩm khỏi giỏ!");
          window.location.reload();
        } else {
          alert("Lỗi khi xóa sản phẩm khỏi giỏ.");
        }
      } catch (error) {
        alert("Có lỗi xảy ra!");
      }
    });
  });