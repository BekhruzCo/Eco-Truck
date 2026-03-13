(function () {
  if (document.body.dataset.page !== "tracker") return;

  const filters = document.getElementById("tracker-filters");
  const list = document.getElementById("tracker-list");
  const map = document.getElementById("tracker-map");
  const detail = document.getElementById("tracker-detail");
  let points = [];
  let currentFilter = "all";
  let selectedId = null;

  function filteredPoints() {
    return points.filter(function (point) {
      return currentFilter === "all" || point.type === currentFilter;
    });
  }

  function showDetail(id) {
    selectedId = id;
    const point = points.find(function (item) {
      return item.id === id;
    });
    if (!point) return;

    detail.innerHTML =
      "<h3>" + point.title + "</h3>" +
      "<p>" + point.description + "</p>" +
      "<p><strong>Status:</strong> " + point.status + "</p>" +
      "<p><strong>Turi:</strong> " + point.type + "</p>";

    render();
  }

  function bindItems() {
    document.querySelectorAll("[data-point-id]").forEach(function (node) {
      node.addEventListener("click", function () {
        showDetail(Number(node.getAttribute("data-point-id")));
      });
    });
  }

  function render() {
    const data = filteredPoints();
    list.innerHTML = data.map(function (point) {
      return (
        '<button class="tracker-item ' + (selectedId === point.id ? "active" : "") + '" type="button" data-point-id="' + point.id + '">' +
        "<h3>" + point.title + "</h3>" +
        "<p>" + point.description + "</p>" +
        "<small>" + point.status + "</small></button>"
      );
    }).join("");

    map.querySelectorAll(".map-marker").forEach(function (marker) {
      marker.remove();
    });

    data.forEach(function (point) {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "map-marker " + point.type + (selectedId === point.id ? " active" : "");
      marker.style.left = point.x + "%";
      marker.style.top = point.y + "%";
      marker.setAttribute("data-point-id", String(point.id));
      map.appendChild(marker);
    });

    if (!data.length) {
      detail.textContent = "Tanlangan filtr bo'yicha nuqta topilmadi.";
    } else if (!selectedId || !data.some(function (point) { return point.id === selectedId; })) {
      selectedId = data[0].id;
      showDetail(selectedId);
      return;
    }

    bindItems();
  }

  function loadPoints() {
    fetch("/api/tracker-points/")
      .then(function (response) { return response.json(); })
      .then(function (payload) {
        points = payload.results || [];
        render();
      })
      .catch(function () {
        window.EcoTrackApp.toast("Tracker ma'lumotlarini yuklab bo'lmadi.", "error");
      });
  }

  filters.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      currentFilter = button.getAttribute("data-filter");
      filters.querySelectorAll(".chip").forEach(function (chip) {
        chip.classList.remove("active");
      });
      button.classList.add("active");
      render();
    });
  });

  loadPoints();
})();
