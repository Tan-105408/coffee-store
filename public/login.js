document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      alert("Đăng nhập thành công!");
      window.location.href = "/";
    } else {
      alert(data.message || "Sai tên đăng nhập hoặc mật khẩu.");
    }
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    alert("Có lỗi xảy ra trong quá trình đăng nhập!");
  }
});
