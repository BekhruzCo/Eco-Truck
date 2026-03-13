(function () {
  const page = document.body.dataset.page || "home";
  const state = {
    lang: localStorage.getItem("ecotrack-lang") || "uz",
    theme: localStorage.getItem("ecotrack-theme") || "light",
    auth: {
      loaded: false,
      authenticated: false,
      full_name: "",
      email: "",
      username: "",
      is_staff: false,
    },
    chatOpen: false,
    messages: [
      {
        text: "Salom. Men sizga ekologiya bo'yicha yordam bera olaman. Savolingiz bormi?",
        user: false,
      },
    ],
  };

  const translations = {
    uz: {
      "nav.tracker": "Kuzatish",
      "nav.map": "Xarita",
      "nav.report": "Xabar berish",
      "nav.learn": "O'rganish",
      "nav.plantDoctor": "Plant Doctor",
      "nav.profile": "Profil",
      "nav.login": "Kirish",
      "nav.register": "Ro'yxatdan o'tish",
      "home.tagline": "Tabiatni birga himoya qilamiz",
      "home.hero": "Sayyoramiz uchun",
      "home.heroAction": "harakat qil!",
      "home.subtitle": "EcoTrack bilan atrof-muhitdagi muammolarni kuzating, xabar bering va ekologik o'zgarishlarga hissa qo'shing.",
      "home.startTracking": "Kuzatishni boshlash",
      "home.learn": "O'rganish",
      "stats.wasteCollected": "Bugun tozalangan chiqindi",
      "stats.activeUsers": "Faol foydalanuvchilar",
      "stats.growth": "Bu oyda o'sish",
      "features.howItWorks": "Qanday ishlaydi?",
      "features.subtitle": "Uch oddiy qadamda atrof-muhitni yaxshilashga yordam bering",
      "features.track": "Kuzatish",
      "features.trackDesc": "Xaritada chiqindi joylarini ko'ring va yaqin atrofingizdagi muammolarni kuzating",
      "features.report": "Xabar berish",
      "features.reportDesc": "Iflos joy yoki ekologik muammoni topganingizda rasmini yuklang va xabar bering",
      "features.reward": "Mukofot oling",
      "features.rewardDesc": "Har bir faol harakatingiz uchun ball to'plang va top eko-faollar ro'yxatida joy oling",
      "cta.title": "Bugun tabiatga yordam bering!",
      "cta.desc": "Har bir kichik harakat katta o'zgarishlarga olib keladi. Bizga qo'shiling va yashil kelajakni birga quramiz.",
      "cta.button": "Xabar berishni boshlash",
      "footer.tagline": "Tabiatni kuzat, himoya qil, foyda keltir!",
      "footer.rights": "Barcha huquqlar himoyalangan",
      "chat.title": "EkoChat",
      "chat.placeholder": "Savolingizni yozing...",
    },
    en: {
      "nav.tracker": "Tracker",
      "nav.map": "Map",
      "nav.report": "Report",
      "nav.learn": "Learn",
      "nav.plantDoctor": "Plant Doctor",
      "nav.profile": "Profile",
      "nav.login": "Login",
      "nav.register": "Sign Up",
      "home.tagline": "Protect nature together",
      "home.hero": "For our planet",
      "home.heroAction": "take action!",
      "home.subtitle": "Track environmental issues, report them and contribute to positive ecological change with EcoTrack.",
      "home.startTracking": "Start Tracking",
      "home.learn": "Learn More",
      "stats.wasteCollected": "Waste collected today",
      "stats.activeUsers": "Active users",
      "stats.growth": "Growth this month",
      "features.howItWorks": "How it works?",
      "features.subtitle": "Help improve the environment in three simple steps",
      "features.track": "Track",
      "features.trackDesc": "See pollution points on the map and monitor issues near you",
      "features.report": "Report",
      "features.reportDesc": "Upload a photo and report an environmental issue in seconds",
      "features.reward": "Get Rewarded",
      "features.rewardDesc": "Earn points for every helpful action and appear on the leaderboard",
      "cta.title": "Help nature today!",
      "cta.desc": "Every small action creates a larger impact. Join us and build a greener future together.",
      "cta.button": "Start Reporting",
      "footer.tagline": "Track, protect and improve nature together.",
      "footer.rights": "All rights reserved",
      "chat.title": "EcoChat",
      "chat.placeholder": "Type your question...",
    },
    ru: {
      "nav.tracker": "Tracker",
      "nav.map": "Map",
      "nav.report": "Report",
      "nav.learn": "Learn",
      "nav.plantDoctor": "Plant Doctor",
      "nav.profile": "Profile",
      "nav.login": "Login",
      "nav.register": "Sign Up",
      "home.tagline": "Protect nature together",
      "home.hero": "For our planet",
      "home.heroAction": "take action!",
      "home.subtitle": "Track environmental issues, report them and contribute to positive ecological change with EcoTrack.",
      "home.startTracking": "Start Tracking",
      "home.learn": "Learn More",
      "stats.wasteCollected": "Waste collected today",
      "stats.activeUsers": "Active users",
      "stats.growth": "Growth this month",
      "features.howItWorks": "How it works?",
      "features.subtitle": "Help improve the environment in three simple steps",
      "features.track": "Track",
      "features.trackDesc": "See pollution points on the map and monitor issues near you",
      "features.report": "Report",
      "features.reportDesc": "Upload a photo and report an environmental issue in seconds",
      "features.reward": "Get Rewarded",
      "features.rewardDesc": "Earn points for every helpful action and appear on the leaderboard",
      "cta.title": "Help nature today!",
      "cta.desc": "Every small action creates a larger impact. Join us and build a greener future together.",
      "cta.button": "Start Reporting",
      "footer.tagline": "Protect nature together.",
      "footer.rights": "All rights reserved",
      "chat.title": "EcoChat",
      "chat.placeholder": "Type your question...",
    },
  };

  const navItems = [
    { href: "/tracker.html", key: "nav.tracker", page: "tracker" },
    { href: "/map.html", key: "nav.map", page: "map" },
    { href: "/report.html", key: "nav.report", page: "report" },
    { href: "/learn.html", key: "nav.learn", page: "learn" },
    { href: "/plant-doctor.html", key: "nav.plantDoctor", page: "plant-doctor" },
    { href: "/profile.html", key: "nav.profile", page: "profile", authOnly: true },
  ];

  function t(key) {
    return (translations[state.lang] && translations[state.lang][key]) || key;
  }

  function setTheme(theme) {
    state.theme = theme;
    document.body.dataset.theme = theme;
    localStorage.setItem("ecotrack-theme", theme);
    const icon = document.querySelector("[data-theme-icon]");
    if (icon) icon.textContent = theme === "dark" ? "Light" : "Dark";
  }

  function headerTemplate() {
    const nav = navItems
      .filter(function (item) {
        return !item.authOnly || state.auth.authenticated;
      })
      .map(function (item) {
        return '<a class="nav-link ' + (item.page === page ? "active" : "") + '" href="' + item.href + '">' + t(item.key) + "</a>";
      })
      .join("");

    const langs = ["uz", "ru", "en"]
      .map(function (lang) {
        return '<button class="lang-btn ' + (state.lang === lang ? "active" : "") + '" data-lang="' + lang + '">' + lang + "</button>";
      })
      .join("");

    const authActions = state.auth.authenticated
      ? '<a class="btn btn-secondary small" href="/profile.html">' + t("nav.profile") + '</a><a class="btn btn-primary small" href="/logout/">Chiqish</a>'
      : '<a class="btn btn-secondary small" href="/login/">' + t("nav.login") + '</a><a class="btn btn-primary small" href="/register/">' + t("nav.register") + "</a>";

    const mobileAuthActions = state.auth.authenticated
      ? '<a class="btn btn-secondary" href="/profile.html">' + t("nav.profile") + '</a><a class="btn btn-primary" href="/logout/">Chiqish</a>'
      : '<a class="btn btn-secondary" href="/login/">' + t("nav.login") + '</a><a class="btn btn-primary" href="/register/">' + t("nav.register") + "</a>";

    return (
      '<header class="site-header"><div class="container nav-bar">' +
      '<a class="brand" href="/"><span class="brand-mark">E</span><span class="brand-text">EcoTrack</span></a>' +
      '<nav class="nav-links">' + nav + "</nav>" +
      '<div class="nav-actions"><div class="lang-switch">' + langs + '</div>' +
      '<button class="theme-toggle" type="button" data-theme-toggle><span data-theme-icon></span></button>' +
      '<div class="auth-actions">' + authActions + "</div></div>" +
      '<button class="mobile-toggle" type="button" data-mobile-toggle>Menu</button></div>' +
      '<div class="container mobile-menu" id="mobile-menu"><div class="mobile-stack">' +
      nav + '<div class="lang-switch">' + langs + '</div>' +
      '<button class="theme-toggle" type="button" data-theme-toggle><span data-theme-icon></span></button>' +
      mobileAuthActions + "</div></div></header>"
    );
  }

  function footerTemplate() {
    return (
      '<footer class="container footer-shell"><div class="footer-grid">' +
      '<div class="footer-copy"><a class="brand" href="/"><span class="brand-mark">E</span><span class="brand-text">EcoTrack</span></a>' +
      "<p>" + t("footer.tagline") + "</p></div>" +
      '<div class="footer-links"><a href="/tracker.html">' + t("nav.tracker") + '</a><a href="/map.html">' + t("nav.map") + '</a><a href="/report.html">' + t("nav.report") + '</a><a href="/learn.html">' + t("nav.learn") + '</a><a href="/plant-doctor.html">' + t("nav.plantDoctor") + "</a></div></div>" +
      '<div class="footer-note">(c) 2026 EcoTrack. ' + t("footer.rights") + "</div></footer>"
    );
  }

  function chatTemplate() {
    const messages = state.messages
      .map(function (message) {
        return '<div class="chat-bubble ' + (message.user ? "user" : "bot") + '">' + message.text + "</div>";
      })
      .join("");

    return (
      '<button class="chat-toggle" type="button" data-chat-toggle>Chat</button>' +
      '<div class="chat-window ' + (state.chatOpen ? "" : "hidden") + '" id="chat-window">' +
      '<div class="chat-header"><strong>' + t("chat.title") + '</strong><button class="action-btn" type="button" data-chat-close>x</button></div>' +
      '<div class="chat-messages">' + messages + '</div>' +
      '<div class="chat-input-row"><input type="text" id="chat-input" placeholder="' + t("chat.placeholder") + '" />' +
      '<button class="btn btn-primary small" type="button" id="chat-send">Yuborish</button></div></div>'
    );
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    });
  }

  function renderShell() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    const chat = document.getElementById("site-chat");
    if (header) header.innerHTML = headerTemplate();
    if (footer) footer.innerHTML = footerTemplate();
    if (chat) chat.innerHTML = chatTemplate();
    applyTranslations();
    bindGlobalEvents();
    setTheme(state.theme);
  }

  function loadAuthState() {
    return fetch("/auth/status/", { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("auth_status_failed");
        return response.json();
      })
      .then(function (data) {
        state.auth = Object.assign({ loaded: true }, state.auth, data, { loaded: true });
      })
      .catch(function () {
        state.auth.loaded = true;
      });
  }

  function bindGlobalEvents() {
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.lang = button.getAttribute("data-lang");
        localStorage.setItem("ecotrack-lang", state.lang);
        renderShell();
      });
    });

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        setTheme(state.theme === "dark" ? "light" : "dark");
      });
    });

    const mobileToggle = document.querySelector("[data-mobile-toggle]");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", function () {
        document.getElementById("mobile-menu").classList.toggle("open");
      });
    }

    const chatToggle = document.querySelector("[data-chat-toggle]");
    const chatClose = document.querySelector("[data-chat-close]");
    const chatSend = document.getElementById("chat-send");
    const chatInput = document.getElementById("chat-input");

    function rerender() {
      renderShell();
    }

    function sendChat() {
      if (!chatInput || !chatInput.value.trim()) return;
      state.messages.push({ text: chatInput.value.trim(), user: true });
      state.chatOpen = true;
      rerender();
      setTimeout(function () {
        state.messages.push({ text: "Tabiatni asrash uchun har bir kichik qadam muhim.", user: false });
        rerender();
      }, 500);
    }

    if (chatToggle) {
      chatToggle.addEventListener("click", function () {
        state.chatOpen = !state.chatOpen;
        rerender();
      });
    }
    if (chatClose) {
      chatClose.addEventListener("click", function () {
        state.chatOpen = false;
        rerender();
      });
    }
    if (chatSend) chatSend.addEventListener("click", sendChat);
    if (chatInput) {
      chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") sendChat();
      });
    }
  }

  function toast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const element = document.createElement("div");
    element.className = "toast " + (type || "success");
    element.textContent = message;
    container.appendChild(element);
    setTimeout(function () {
      element.remove();
    }, 2800);
  }

  function revealOnScroll() {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach(function (item) {
      observer.observe(item);
    });
  }

  window.EcoTrackApp = { toast: toast, t: t };
  document.body.dataset.theme = state.theme;
  loadAuthState().finally(function () {
    renderShell();
    revealOnScroll();
  });
})();
