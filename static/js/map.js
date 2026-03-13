(function () {
  if (document.body.dataset.page !== "map") return;

  const form = document.getElementById("bin-location-form");
  const detectButton = document.getElementById("detect-location-btn");
  const latitudeInput = document.getElementById("bin-latitude");
  const longitudeInput = document.getElementById("bin-longitude");
  const locationReadout = document.getElementById("location-readout");
  const errorBox = document.getElementById("bin-map-error");
  const successBox = document.getElementById("bin-map-success");
  const currentLocationStatus = document.getElementById("current-location-status");
  const recenterButton = document.getElementById("recenter-location-btn");
  const showNearestButton = document.getElementById("show-nearest-bin-btn");
  const showAllButton = document.getElementById("show-all-bins-btn");
  const nearbyBinsList = document.getElementById("nearby-bins-list");
  const imageInput = document.getElementById("bin-image-input");
  const previewWrap = document.getElementById("bin-image-preview-wrap");
  const previewImage = document.getElementById("bin-image-preview");
  const detailBox = document.getElementById("map-selected-detail");

  const DEFAULT_CENTER = [41.3111, 69.2797];
  const BIN_VISIBLE_ZOOM = 16;
  const map = L.map("community-map").setView(DEFAULT_CENTER, 12);
  const markers = L.layerGroup().addTo(map);

  let pendingMarker = null;
  let userMarker = null;
  let accuracyCircle = null;
  let lastKnownPosition = null;
  let allPoints = [];
  let pointMarkers = {};

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  function setMessage(type, message) {
    errorBox.classList.toggle("hidden", type !== "error");
    successBox.classList.toggle("hidden", type !== "success");
    if (type === "error") {
      errorBox.textContent = message;
    } else if (type === "success") {
      successBox.textContent = message;
    } else {
      errorBox.textContent = "";
      successBox.textContent = "";
    }
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function distanceKm(fromLat, fromLng, toLat, toLng) {
    const earthRadius = 6371;
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function updateLocation(lat, lng, text) {
    latitudeInput.value = lat;
    longitudeInput.value = lng;
    locationReadout.textContent = text || ("Lat: " + lat.toFixed(6) + ", Lng: " + lng.toFixed(6));
    if (pendingMarker) {
      pendingMarker.setLatLng([lat, lng]);
    } else {
      pendingMarker = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng], 17);
  }

  function updateUserLocation(lat, lng, accuracy) {
    lastKnownPosition = [lat, lng];
    currentLocationStatus.textContent = lat.toFixed(5) + ", " + lng.toFixed(5);

    if (!userMarker) {
      userMarker = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#3a84ff",
        fillOpacity: 1,
      }).addTo(map);
      userMarker.bindPopup("Sizning joriy joyingiz");
    } else {
      userMarker.setLatLng([lat, lng]);
    }

    if (!accuracyCircle) {
      accuracyCircle = L.circle([lat, lng], {
        radius: accuracy || 25,
        color: "#3a84ff",
        weight: 1,
        fillColor: "#3a84ff",
        fillOpacity: 0.12,
      }).addTo(map);
    } else {
      accuracyCircle.setLatLng([lat, lng]);
      accuracyCircle.setRadius(accuracy || 25);
    }
  }

  function renderDetail(point) {
    detailBox.innerHTML =
      "<h3>" + point.title + "</h3>" +
      "<p>" + (point.description || "Izoh kiritilmagan.") + "</p>" +
      "<p><strong>Joylashuv:</strong> " + point.latitude.toFixed(6) + ", " + point.longitude.toFixed(6) + "</p>" +
      "<p><strong>Qo'shgan:</strong> " + point.created_by + "</p>" +
      (point.distance_km != null ? "<p><strong>Masofa:</strong> " + point.distance_km.toFixed(2) + " km</p>" : "");
  }

  function focusPoint(point) {
    if (!point) return;
    map.setView([point.latitude, point.longitude], Math.max(map.getZoom(), BIN_VISIBLE_ZOOM));
    renderDetail(point);
    if (pointMarkers[point.id]) {
      pointMarkers[point.id].openPopup();
    }
  }

  function renderNearbyList() {
    if (!lastKnownPosition || !allPoints.length) {
      nearbyBinsList.textContent = "Joriy joy aniqlangach yaqin qutilar shu yerda chiqadi.";
      return;
    }

    const nearestPoints = allPoints
      .map(function (point) {
        return Object.assign({}, point, {
          distance_km: distanceKm(lastKnownPosition[0], lastKnownPosition[1], point.latitude, point.longitude),
        });
      })
      .sort(function (a, b) { return a.distance_km - b.distance_km; })
      .slice(0, 5);

    nearbyBinsList.innerHTML = nearestPoints.map(function (point, index) {
      return (
        '<button class="nearby-bin-item" type="button" data-nearby-bin="' + point.id + '">' +
        '<span class="nearby-bin-rank">' + (index + 1) + '</span>' +
        '<span class="nearby-bin-copy"><strong>' + point.title + '</strong><small>' + point.distance_km.toFixed(2) + ' km uzoqlikda</small></span>' +
        "</button>"
      );
    }).join("");

    document.querySelectorAll("[data-nearby-bin]").forEach(function (button) {
      button.addEventListener("click", function () {
        const pointId = Number(button.getAttribute("data-nearby-bin"));
        const point = nearestPoints.find(function (item) { return item.id === pointId; });
        focusPoint(point);
      });
    });
  }

  function renderMarkers(points) {
    markers.clearLayers();
    pointMarkers = {};
    if (map.getZoom() < BIN_VISIBLE_ZOOM) {
      detailBox.innerHTML = "Chiqindi qutilarini ko'rish uchun xaritani yaqinlashtiring.";
      return;
    }

    points.forEach(function (point) {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: "#7fba34",
        fillOpacity: 1,
      }).addTo(markers);

      let popup = "<strong>" + point.title + "</strong><br>" + (point.description || "Izoh yo'q");
      if (point.image) {
        popup += '<br><img src="' + point.image + '" alt="" style="width:100%;max-width:180px;margin-top:8px;border-radius:10px;">';
      }
      if (point.video) {
        popup += '<br><video controls style="width:100%;max-width:180px;margin-top:8px;border-radius:10px;"><source src="' + point.video + '"></video>';
      }

      marker.bindPopup(popup);
      marker.on("click", function () {
        const enrichedPoint = lastKnownPosition
          ? Object.assign({}, point, {
              distance_km: distanceKm(lastKnownPosition[0], lastKnownPosition[1], point.latitude, point.longitude),
            })
          : point;
        renderDetail(enrichedPoint);
      });
      pointMarkers[point.id] = marker;
    });
  }

  function loadPoints() {
    fetch("/api/bin-locations/")
      .then(function (response) { return response.json(); })
      .then(function (payload) {
        allPoints = payload.results || [];
        renderMarkers(allPoints);
        renderNearbyList();
      })
      .catch(function () {
        setMessage("error", "Xarita ma'lumotlarini yuklab bo'lmadi.");
      });
  }

  function fallbackToIpLocation(fillForm) {
    currentLocationStatus.textContent = "IP orqali aniqlanmoqda...";
    fetch("https://ipapi.co/json/")
      .then(function (response) {
        if (!response.ok) throw new Error("ip_lookup_failed");
        return response.json();
      })
      .then(function (data) {
        if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
          throw new Error("ip_location_missing");
        }
        updateUserLocation(data.latitude, data.longitude, 1500);
        if (fillForm) {
          updateLocation(
            data.latitude,
            data.longitude,
            "Taxminiy joy aniqlandi: " + data.latitude.toFixed(6) + ", " + data.longitude.toFixed(6)
          );
        } else {
          map.setView([data.latitude, data.longitude], 14);
        }
        renderNearbyList();
        setMessage("success", "GPS ishlamadi, taxminiy lokatsiya internet orqali olindi.");
      })
      .catch(function () {
        currentLocationStatus.textContent = "Aniqlanmadi";
        setMessage("error", "Lokatsiyani aniqlab bo'lmadi. GPS yoki internet lokatsiya mavjud emas.");
      });
  }

  function detectCurrentLocation(options) {
    setMessage(null, "");
    if (!navigator.geolocation) {
      currentLocationStatus.textContent = "Brauzer qo'llab-quvvatlamaydi";
      setMessage("error", "Brauzer geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    currentLocationStatus.textContent = "Aniqlanmoqda...";
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        updateUserLocation(lat, lng, accuracy);
        if (!options || options.fillForm !== false) {
          updateLocation(lat, lng, "Joy aniqlandi: " + lat.toFixed(6) + ", " + lng.toFixed(6));
        } else {
          map.setView([lat, lng], 17);
        }
        renderNearbyList();
      },
      function () {
        currentLocationStatus.textContent = "GPS bloklangan";
        fallbackToIpLocation(!options || options.fillForm !== false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }

  detectButton.addEventListener("click", function () {
    detectCurrentLocation({ fillForm: true });
  });

  recenterButton.addEventListener("click", function () {
    if (lastKnownPosition) {
      map.setView(lastKnownPosition, 17);
      if (userMarker) userMarker.openPopup();
      return;
    }
    detectCurrentLocation({ fillForm: false });
  });

  showNearestButton.addEventListener("click", function () {
    if (!lastKnownPosition || !allPoints.length) {
      setMessage("error", "Avval joriy joy va xarita nuqtalari yuklansin.");
      return;
    }
    const nearestPoint = allPoints
      .map(function (point) {
        return Object.assign({}, point, {
          distance_km: distanceKm(lastKnownPosition[0], lastKnownPosition[1], point.latitude, point.longitude),
        });
      })
      .sort(function (a, b) { return a.distance_km - b.distance_km; })[0];
    focusPoint(nearestPoint);
  });

  showAllButton.addEventListener("click", function () {
    if (!allPoints.length) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }
    const bounds = L.latLngBounds(allPoints.map(function (point) {
      return [point.latitude, point.longitude];
    }));
    if (lastKnownPosition) {
      bounds.extend(lastKnownPosition);
    }
    map.fitBounds(bounds.pad(0.2));
  });

  imageInput.addEventListener("change", function () {
    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      previewWrap.classList.add("hidden");
      previewImage.removeAttribute("src");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      previewImage.src = event.target.result;
      previewWrap.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setMessage(null, "");

    const formData = new FormData(form);
    fetch("/api/bin-locations/create/", {
      method: "POST",
      body: formData,
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || "request_failed");
          return data;
        });
      })
      .then(function (data) {
        setMessage("success", data.message || "Nuqta qo'shildi.");
        form.reset();
        latitudeInput.value = "";
        longitudeInput.value = "";
        locationReadout.textContent = "Lokatsiya hali olinmagan.";
        previewWrap.classList.add("hidden");
        previewImage.removeAttribute("src");
        if (pendingMarker) {
          map.removeLayer(pendingMarker);
          pendingMarker = null;
        }
        loadPoints();
      })
      .catch(function (error) {
        setMessage("error", error.message);
      });
  });

  map.on("click", function (event) {
    updateLocation(
      event.latlng.lat,
      event.latlng.lng,
      "Xaritadan tanlandi: " + event.latlng.lat.toFixed(6) + ", " + event.latlng.lng.toFixed(6)
    );
  });

  map.on("zoomend", function () {
    renderMarkers(allPoints);
  });

  detectCurrentLocation({ fillForm: false });
  loadPoints();
})();
