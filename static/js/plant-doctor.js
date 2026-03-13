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

  function renderList(targetId, items) {
    const list = document.getElementById(targetId);
    list.innerHTML = "";
    items.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }

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
    fetch("/plant-doctor/analyze/", {
      method: "POST",
      body: formData,
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            throw new Error(data.error || "request_failed");
          }
          return data;
        });
      })
      .then(function (data) {
        emptyState.classList.add("hidden");
        resultBody.classList.remove("hidden");
        document.getElementById("analysis-plant-name").textContent = data.plant;
        document.getElementById("analysis-overview").textContent = data.overview;
        document.getElementById("analysis-disease").textContent = data.disease;
        document.getElementById("analysis-present").textContent = data.disease_present ? "Ha" : "Yo'q";
        document.getElementById("analysis-confidence").textContent = data.confidence;
        document.getElementById("analysis-urgency").textContent = data.urgency;
        document.getElementById("analysis-note").textContent = data.note;
        renderList("analysis-treatment", data.treatment || []);
        renderList("analysis-prevention", data.prevention || []);
        setMessage("success", "Tahlil tayyor.");
      })
      .catch(function (error) {
        setMessage("error", error.message);
      });
  });
})();
