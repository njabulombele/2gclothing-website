/* ============================================
   2G CLOTHING — MAIN JS
   Cart, UI interactions, animations
   ============================================ */

// ---- CART STATE ----
let cart = JSON.parse(localStorage.getItem("2g-cart") || "[]");

function saveCart() {
  localStorage.setItem("2g-cart", JSON.stringify(cart));
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function addToCart(productId, size, qty = 1) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const existing = cart.find((i) => i.id === productId && i.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      size: size,
      qty: qty,
      image: product.images[0],
    });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(productId, size) {
  cart = cart.filter((i) => !(i.id === productId && i.size === size));
  saveCart();
  updateCartUI();
  if (typeof renderCart === "function") renderCart();
}

function updateQty(productId, size, newQty) {
  const item = cart.find((i) => i.id === productId && i.size === size);
  if (!item) return;
  if (newQty < 1) {
    removeFromCart(productId, size);
    return;
  }
  item.qty = newQty;
  saveCart();
  updateCartUI();
  if (typeof renderCart === "function") renderCart();
}

function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.classList.toggle("visible", count > 0);
  });
}

// ---- TOAST ----
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.innerHTML = `<span class="toast__icon">✓</span><span class="toast__message"></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector(".toast__message").textContent = message;
  toast.classList.add("visible");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// ---- NAV HAMBURGER ----
function initNav() {
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileNav = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav__close");
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener("click", () => {
    mobileNav.classList.add("open");
    document.body.style.overflow = "hidden";
  });
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      document.body.style.overflow = "";
    });
  }
  // close on link click
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

// ---- HERO VIDEO SLIDER ----
function initHeroSlider() {
  const videos = document.querySelectorAll(".hero__video");
  const dots = document.querySelectorAll(".hero__dot");
  const muteBtn = document.getElementById("mute-btn");
  if (!videos.length) return;

  let current = 0;
  let isMuted = true;

  function goTo(index) {
    // Pause and hide current
    videos[current].pause();
    videos[current].classList.remove("active");
    if (dots[current]) dots[current].classList.remove("active");

    // Show and play new
    current = index;
    const v = videos[current];
    v.classList.add("active");
    v.muted = isMuted;
    v.currentTime = 0;
    v.play().catch(() => {}); // catch autoplay block silently
    if (dots[current]) dots[current].classList.add("active");
  }

  // When current video ends, advance to next
  videos.forEach((v, i) => {
    v.addEventListener("ended", () => {
      goTo((i + 1) % videos.length);
    });
    // Also preload the next video when current one starts playing
    v.addEventListener("play", () => {
      const next = videos[(i + 1) % videos.length];
      if (next.preload === "none") next.preload = "auto";
    });
  });

  // Dot click
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i));
  });

  // Mute / unmute toggle
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      videos[current].muted = isMuted;
      muteBtn.querySelector(".icon-muted").style.display = isMuted
        ? ""
        : "none";
      muteBtn.querySelector(".icon-unmuted").style.display = !isMuted
        ? ""
        : "none";
    });
  }

  // Start first video
  videos[0].play().catch(() => {});
}

// ---- ACCORDION ----
function initAccordions() {
  document.querySelectorAll(".accordion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".accordion-item");
      const isOpen = item.classList.contains("open");
      document
        .querySelectorAll(".accordion-item")
        .forEach((i) => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });
}

// ---- BACK TO TOP ----
function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

// ---- PRODUCT GALLERY (product page) ----
function initProductGallery() {
  const mainImg = document.querySelector(".product-gallery__main img");
  const thumbs = document.querySelectorAll(".product-gallery__thumb");
  if (!mainImg || !thumbs.length) return;
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      mainImg.src = thumb.querySelector("img").src;
    });
  });
}

// ---- SIZE SELECTION ----
function initSizeSelection() {
  document.querySelectorAll(".size-btn:not(.sold-out)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".size-grid");
      group
        .querySelectorAll(".size-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ---- QTY CONTROL ----
function initQtyControl() {
  document.querySelectorAll(".qty-control").forEach((ctrl) => {
    const input = ctrl.querySelector(".qty-input");
    ctrl.querySelector(".qty-minus")?.addEventListener("click", () => {
      const val = parseInt(input.value) || 1;
      if (val > 1) input.value = val - 1;
    });
    ctrl.querySelector(".qty-plus")?.addEventListener("click", () => {
      const val = parseInt(input.value) || 1;
      input.value = val + 1;
    });
  });
}

// ---- ADD TO CART BUTTON (product page) ----
function initAddToCart() {
  const addBtn = document.getElementById("add-to-cart-btn");
  if (!addBtn) return;
  addBtn.addEventListener("click", () => {
    const activeSize = document.querySelector(".size-btn.active");
    if (!activeSize) {
      showToast("Please select a size");
      return;
    }
    const size = activeSize.dataset.size;
    const qty = parseInt(document.querySelector(".qty-input")?.value || "1");
    const productId = parseInt(addBtn.dataset.productId);
    addToCart(productId, size, qty);
  });
}

// ---- QUICK ADD (product cards) ----
function initQuickAdd() {
  document.querySelectorAll(".product-card__quick-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId);
      openQuickView(productId);
    });
  });
}

// ---- QUICK VIEW MODAL ----
function openQuickView(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const overlay = document.getElementById("quick-view-overlay");
  if (!overlay) return;
  overlay.querySelector(".modal__image img").src = product.images[0];
  overlay.querySelector(".modal__name").textContent = product.name;
  overlay.querySelector(".modal__price").textContent =
    `R ${product.price.toFixed(2)}`;
  overlay.querySelector(".modal__desc").textContent = product.description;
  const sizeGrid = overlay.querySelector(".modal__sizes");
  sizeGrid.innerHTML = "";
  product.sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.className = "size-btn";
    btn.dataset.size = size;
    btn.textContent = size;
    btn.addEventListener("click", () => {
      sizeGrid
        .querySelectorAll(".size-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    sizeGrid.appendChild(btn);
  });
  const addBtn = overlay.querySelector(".modal__add-btn");
  addBtn.onclick = () => {
    const activeSize = sizeGrid.querySelector(".size-btn.active");
    if (!activeSize) {
      showToast("Please select a size");
      return;
    }
    addToCart(productId, activeSize.dataset.size, 1);
    closeQuickView();
  };
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeQuickView() {
  const overlay = document.getElementById("quick-view-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function initQuickView() {
  const overlay = document.getElementById("quick-view-overlay");
  if (!overlay) return;
  overlay
    .querySelector(".modal__close")
    ?.addEventListener("click", closeQuickView);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeQuickView();
  });
}

// ---- SCROLL REVEAL ----
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document
    .querySelectorAll(".product-card, .collection-card, .section-story")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(el);
    });
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  initNav();
  initHeroSlider();
  initAccordions();
  initBackToTop();
  initProductGallery();
  initSizeSelection();
  initQtyControl();
  initAddToCart();
  initQuickAdd();
  initQuickView();
  setTimeout(initScrollReveal, 100);
});
