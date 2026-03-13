(function () {
  if (document.body.dataset.page !== "profile") return;

  function renderChart(chartData) {
    const chart = document.getElementById("profile-chart");
    const safeData = chartData && chartData.length ? chartData : [{ month: "Yan", value: 0 }];
    const max = Math.max.apply(null, safeData.map(function (item) { return item.value; })) || 1;
    const width = 760;
    const height = 260;
    const step = safeData.length > 1 ? width / (safeData.length - 1) : width / 2;
    const points = safeData.map(function (item, index) {
      const x = safeData.length > 1 ? index * step : width / 2;
      const y = height - (item.value / max) * (height - 40) - 20;
      return x + "," + y;
    }).join(" ");

    chart.innerHTML =
      '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Faollik statistikasi">' +
      '<polyline fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="1" points="0,' + (height - 20) + " " + width + "," + (height - 20) + '"></polyline>' +
      '<polyline fill="none" stroke="var(--primary)" stroke-width="4" points="' + points + '"></polyline>' +
      safeData.map(function (item, index) {
        const x = safeData.length > 1 ? index * step : width / 2;
        const y = height - (item.value / max) * (height - 40) - 20;
        return (
          '<circle cx="' + x + '" cy="' + y + '" r="6" fill="var(--primary)"></circle>' +
          '<text x="' + x + '" y="' + (height - 2) + '" text-anchor="middle" fill="var(--muted)" font-size="14">' + item.month + "</text>"
        );
      }).join("") +
      "</svg>";
  }

  fetch("/profile/data/", { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) throw new Error("profile_data_failed");
      return response.json();
    })
    .then(function (data) {
      var rankLabel = data.rank === "-" ? "-" : "#" + data.rank;
      document.getElementById("profile-avatar").textContent = (data.full_name || "U").charAt(0).toUpperCase();
      document.getElementById("profile-name").textContent = data.full_name;
      document.getElementById("profile-summary").textContent =
        data.points + " ball, reytingda " + rankLabel + " va " + data.reports + " ta yuborilgan xabar.";
      document.getElementById("profile-email").textContent = data.email || "-";
      document.getElementById("profile-username").textContent = data.username;
      document.getElementById("profile-phone").textContent = data.phone;
      document.getElementById("profile-level").textContent = data.eco_level;
      document.getElementById("profile-progress-bar").style.width = data.progress_percent + "%";
      document.getElementById("profile-progress-label").textContent = data.progress_percent + "% to Level " + data.next_level;
      document.getElementById("profile-resolved").textContent = data.resolved_reports + " ta";
      document.getElementById("profile-stat-reports").textContent = data.reports;
      document.getElementById("profile-stat-resolved").textContent = data.resolved_reports;
      document.getElementById("profile-stat-rank").textContent = rankLabel;
      document.getElementById("profile-side-points").textContent = data.points;
      document.getElementById("profile-side-reports").textContent = data.reports;
      document.getElementById("profile-side-rank").textContent = rankLabel;
      document.getElementById("profile-badge-method").textContent = data.registration_method + " orqali";
      document.getElementById("profile-badge-email").textContent = data.email || data.username;
      if (data.is_staff) {
        document.getElementById("profile-admin-link").classList.remove("hidden");
      }
      renderChart(data.chart || []);
      document.getElementById("badge-grid").innerHTML = (data.badges || []).map(function (badge) {
        return (
          '<article class="badge-item ' + (badge.earned ? "earned" : "") + '">' +
          '<div class="badge-icon">' + badge.icon + "</div>" +
          "<strong>" + badge.name + "</strong>" +
          "</article>"
        );
      }).join("");
    })
    .catch(function () {
      if (window.EcoTrackApp && typeof window.EcoTrackApp.toast === "function") {
        window.EcoTrackApp.toast("Profil ma'lumotlarini yuklab bo'lmadi.", "error");
      }
    });
})();
