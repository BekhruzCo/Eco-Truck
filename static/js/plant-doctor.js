(function () {
  if (document.body.dataset.page !== "plant-doctor") return;

  const form = document.getElementById("plant-doctor-form");
  const imageInput = document.getElementById("plant-image-input");
  const previewWrap = document.getElementById("plant-image-preview-wrap");
  const previewImage = document.getElementById("plant-image-preview");
  const errorBox = document.getElementById("plant-doctor-error");
  const successBox = document.getElementById("plant-doctor-success");
  const emptyState = document.getElementById("plant-doctor-empty");
  const resultBody = document.getElementById("plant-doctor-result-body");
  const limitBox = document.getElementById("plant-doctor-limit");

  function setMessage(type, message) {
    errorBox.classList.toggle("hidden", type !== "error");
    successBox.classList.toggle("hidden", type !== "success");

    if (type === "error") {
      errorBox.textContent = message;
      successBox.textContent = "";
    } else if (type === "success") {
      successBox.textContent = message;
      errorBox.textContent = "";
    } else {
      errorBox.textContent = "";
      successBox.textContent = "";
    }
  }

  function renderList(targetId, items) {
    const list = document.getElementById(targetId);
    if (!list) return;

    list.innerHTML = "";
    (items || []).forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

    if (!items || !items.length) {
      const li = document.createElement("li");
      li.textContent = "Ma'lumot yo'q";
      list.appendChild(li);
    }
  }

  function updateLimitInfo() {
    if (!limitBox) return;

    fetch("/auth/status/")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (!data.authenticated) {
          limitBox.textContent = "Plant Doctor AI dan foydalanish uchun tizimga kiring.";
          return;
        }

        if (data.is_superuser) {
          limitBox.textContent = "Sizda AI uchun cheksiz foydalanish huquqi mavjud.";
          return;
        }

        if (typeof data.remaining_ai_uses === "number" && typeof data.daily_ai_limit === "number") {
          limitBox.textContent =
            "Bugungi limit: " + data.remaining_ai_uses + "/" + data.daily_ai_limit;
        } else {
          limitBox.textContent = "Kunlik AI limitingiz mavjud.";
        }
      })
      .catch(function () {
        limitBox.textContent = "";
      });
  }

  imageInput.addEventListener("change", function () {
    const file = imageInput.files && imageInput.files[0];
    setMessage(null, "");

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

    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      setMessage("error", "Avval rasm tanlang.");
      return;
    }

    const formData = new FormData(form);

    fetch("/plant-doctor/analyze/", {
      method: "POST",
      body: formData,
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            throw new Error(data.error || "Xatolik yuz berdi.");
          }
          return data;
        });
      })
      .then(function (data) {
        emptyState.classList.add("hidden");
        resultBody.classList.remove("hidden");

        document.getElementById("analysis-plant-name").textContent = data.plant || "Aniqlanmadi";
        document.getElementById("analysis-overview").textContent = data.overview || "Ma'lumot yo'q";
        document.getElementById("analysis-disease").textContent = data.disease || "Aniqlanmadi";
        document.getElementById("analysis-present").textContent = data.disease_present ? "Ha" : "Yo'q";
        document.getElementById("analysis-confidence").textContent = data.confidence || "Noma'lum";
        document.getElementById("analysis-urgency").textContent = data.urgency || "Noma'lum";
        document.getElementById("analysis-note").textContent = data.note || "Qo'shimcha izoh yo'q";

        renderList("analysis-treatment", data.treatment || []);
        renderList("analysis-prevention", data.prevention || []);

        if (data.is_superuser) {
          setMessage("success", "Tahlil tayyor. Siz uchun limit qo'llanmaydi.");
        } else if (
          typeof data.remaining_ai_uses === "number" &&
          typeof data.daily_ai_limit === "number"
        ) {
          setMessage(
            "success",
            "Tahlil tayyor. Bugungi qolgan limitingiz: " +
              data.remaining_ai_uses +
              "/" +
              data.daily_ai_limit
          );
        } else {
          setMessage("success", "Tahlil tayyor.");
        }

        updateLimitInfo();
      })
      .catch(function (error) {
        setMessage("error", error.message);
      });
  });

  updateLimitInfo();
})();
