(function () {
  if (document.body.dataset.page !== "report") return;

  const form = document.getElementById("report-form");
  const typeInput = document.getElementById("report-type");
  const imageInput = document.getElementById("report-image");
  const imageName = document.getElementById("report-image-name");
  const success = document.getElementById("report-success");
  const submit = document.getElementById("report-submit");
  const detect = document.getElementById("detect-location");
  const locationInput = document.getElementById("report-location");

  document.querySelectorAll(".type-option").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".type-option").forEach(function (item) {
        item.classList.remove("active");
      });
      button.classList.add("active");
      typeInput.value = button.dataset.type;
    });
  });

  imageInput.addEventListener("change", function () {
    imageName.textContent = imageInput.files && imageInput.files[0] ? imageInput.files[0].name : "Rasm yuklash uchun bosing";
  });

  detect.addEventListener("click", function () {
    if (!navigator.geolocation) {
      window.EcoTrackApp.toast("Brauzer geolokatsiyani qo'llamaydi.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        locationInput.value = position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4);
        window.EcoTrackApp.toast("Joylashuv aniqlandi.");
      },
      function () {
        window.EcoTrackApp.toast("Joylashuvni aniqlab bo'lmadi.", "error");
      }
    );
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submit.disabled = true;
    submit.textContent = "Yuborilmoqda...";

    const payload = new FormData();
    payload.append("type", typeInput.value);
    payload.append("location", document.getElementById("report-location").value);
    payload.append("description", document.getElementById("report-description").value);
    if (imageInput.files && imageInput.files[0]) {
      payload.append("image", imageInput.files[0]);
    }

    fetch("/api/reports/create/", { method: "POST", body: payload })
      .then(function (response) {
        if (!response.ok) throw new Error("request_failed");
        return response.json();
      })
      .then(function () {
        success.classList.remove("hidden");
        form.reset();
        document.querySelectorAll(".type-option").forEach(function (item, index) {
          item.classList.toggle("active", index === 0);
        });
        typeInput.value = "trash";
        imageName.textContent = "Rasm yuklash uchun bosing";
        submit.disabled = false;
        submit.textContent = "Xabar yuborish";
        window.EcoTrackApp.toast("Xabar yuborildi. Rahmat.");
        setTimeout(function () {
          success.classList.add("hidden");
        }, 3000);
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = "Xabar yuborish";
        window.EcoTrackApp.toast("Xabarni saqlab bo'lmadi.", "error");
      });
  });
})();
