const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);

document.getElementById("stripe-button")?.addEventListener("click", async () => {
  try {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { sessionId } = await response.json();
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      alert(error.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Có lỗi khi chuyển hướng đến Stripe.");
  }
});