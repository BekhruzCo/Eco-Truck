(function () {
  if (document.body.dataset.page !== "admin") return;

  let reports = [];
  const labels = {
    trash: "Axlat",
    water: "Suv ifloslanishi",
    tree: "Daraxt kesish",
    pending: "Kutilmoqda",
    in_progress: "Jarayonda",
    resolved: "Hal qilindi",
  };

  const search = document.getElementById("admin-search");
  const status = document.getElementById("admin-status");
  const type = document.getElementById("admin-type");
  const body = document.getElementById("admin-table-body");
  const empty = document.getElementById("admin-empty");
  const modal = document.getElementById("admin-modal");
  const modalContent = document.getElementById("admin-modal-content");

  function filteredReports() {
    return reports.filter(function (report) {
      const query = search.value.trim().toLowerCase();
      const matchesQuery =
        !query ||
        report.location.toLowerCase().indexOf(query) !== -1 ||
        report.description.toLowerCase().indexOf(query) !== -1 ||
        report.reporter.toLowerCase().indexOf(query) !== -1;
      const matchesStatus = status.value === "all" || report.status === status.value;
      const matchesType = type.value === "all" || report.type === type.value;
      return matchesQuery && matchesStatus && matchesType;
    });
  }

  function renderStats(list) {
    const stats = [
      { label: "Jami hisobotlar", value: list.length },
      { label: "Kutilmoqda", value: list.filter(function (item) { return item.status === "pending"; }).length },
      { label: "Jarayonda", value: list.filter(function (item) { return item.status === "in_progress"; }).length },
      { label: "Hal qilindi", value: list.filter(function (item) { return item.status === "resolved"; }).length },
    ];

    document.getElementById("admin-stats").innerHTML = stats.map(function (item) {
      return '<article class="stat-card"><p class="stat-value">' + item.value + '</p><p class="stat-label">' + item.label + "</p></article>";
    }).join("");
  }

  function openModal(id) {
    const report = reports.find(function (item) { return item.id === id; });
    if (!report) return;
    modalContent.innerHTML =
      '<img class="modal-image" src="' + report.image + '" alt="Report image" />' +
      "<h2>Hisobot #" + report.id + "</h2>" +
      "<p>" + report.description + "</p>" +
      '<div class="modal-meta">' +
      "<div><strong>Turi</strong><p>" + labels[report.type] + "</p></div>" +
      "<div><strong>Status</strong><p>" + labels[report.status] + "</p></div>" +
      "<div><strong>Joylashuv</strong><p>" + report.location + "</p></div>" +
      "<div><strong>Yuboruvchi</strong><p>" + report.reporter + "</p></div>" +
      "</div>";
    modal.classList.remove("hidden");
  }

  function updateStatus(id, nextStatus) {
    fetch("/api/reports/" + id + "/status/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("request_failed");
        return response.json();
      })
      .then(function () {
        window.EcoTrackApp.toast("Hisobot yangilandi.");
        loadReports();
      })
      .catch(function () {
        window.EcoTrackApp.toast("Statusni yangilab bo'lmadi.", "error");
      });
  }

  function bindTableActions() {
    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        openModal(Number(button.dataset.view));
      });
    });

    document.querySelectorAll("[data-approve]").forEach(function (button) {
      button.addEventListener("click", function () {
        updateStatus(Number(button.dataset.approve), "resolved");
      });
    });
  }

  function renderTable() {
    const list = filteredReports();
    renderStats(list);

    body.innerHTML = list.map(function (report) {
      return (
        "<tr>" +
        "<td>#" + report.id + "</td>" +
        "<td>" + labels[report.type] + "</td>" +
        "<td>" + report.location + "</td>" +
        "<td>" + report.reporter + "</td>" +
        "<td>" + report.date + "</td>" +
        '<td><span class="status-pill ' + report.status + '">' + labels[report.status] + "</span></td>" +
        '<td><div class="table-actions">' +
        '<button class="action-btn" type="button" data-view="' + report.id + '">Ko\'rish</button>' +
        '<button class="action-btn" type="button" data-approve="' + report.id + '">Tasdiq</button>' +
        "</div></td></tr>"
      );
    }).join("");

    empty.classList.toggle("hidden", list.length > 0);
    bindTableActions();
  }

  function loadReports() {
    fetch("/api/reports/")
      .then(function (response) {
        if (!response.ok) throw new Error("request_failed");
        return response.json();
      })
      .then(function (payload) {
        reports = payload.results || [];
        renderTable();
      })
      .catch(function () {
        window.EcoTrackApp.toast("Admin hisobotlarini yuklab bo'lmadi.", "error");
      });
  }

  [search, status, type].forEach(function (node) {
    node.addEventListener("input", renderTable);
    node.addEventListener("change", renderTable);
  });

  document.getElementById("admin-export").addEventListener("click", function () {
    window.EcoTrackApp.toast("Export keyingi bosqichda ulanadi.");
  });

  document.querySelectorAll("[data-close-modal]").forEach(function (node) {
    node.addEventListener("click", function () {
      modal.classList.add("hidden");
    });
  });

  loadReports();
})();
