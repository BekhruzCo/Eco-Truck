(function () {
  if (document.body.dataset.page !== "auth-register") return;

  const state = {
    token: null,
  };

  const errorBox = document.getElementById("register-error");
  const successBox = document.getElementById("register-success");
  const stages = document.querySelectorAll(".register-stage");
  const indicators = document.querySelectorAll("[data-step-indicator]");

  function showStep(step) {
    stages.forEach(function (stage) {
      stage.classList.toggle("hidden", stage.dataset.step !== step);
    });

    indicators.forEach(function (indicator) {
      const active = indicator.dataset.stepIndicator === step;
      indicator.classList.toggle("active", active);
    });

  }

  function setMessage(type, message) {
    errorBox.classList.toggle("hidden", type !== "error");
    successBox.classList.toggle("hidden", type !== "success");
    if (type === "error") {
      errorBox.textContent = message;
    } else if (type === "success") {
      successBox.textContent = message;
    } else {
      errorBox.classList.add("hidden");
      successBox.classList.add("hidden");
    }
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "request_failed");
        }
        return data;
      });
    });
  }

  document.querySelectorAll("[data-back]").forEach(function (button) {
    button.addEventListener("click", function () {
      showStep(button.dataset.back);
      setMessage(null, "");
    });
  });

  document.getElementById("register-submit").addEventListener("click", function () {
    setMessage(null, "");

    postJson("/register/start/", {
      full_name: document.getElementById("register-full-name").value.trim(),
      username: document.getElementById("register-username").value.trim(),
      email: document.getElementById("register-email").value.trim(),
      phone: document.getElementById("register-phone").value.trim(),
      password: document.getElementById("register-password").value,
      confirm_password: document.getElementById("register-password-confirm").value,
    })
      .then(function (data) {
        state.token = data.token;
        setMessage("success", data.message);
        showStep(data.next_step);
      })
      .catch(function (error) {
        setMessage("error", error.message);
      });
  });

  document.getElementById("register-verify-submit").addEventListener("click", function () {
    setMessage(null, "");
    postJson("/register/verify-email/", {
      token: state.token,
      code: document.getElementById("register-code").value.trim(),
    })
      .then(function (data) {
        setMessage("success", data.message);
        window.location.href = data.redirect_url || "/profile.html";
      })
      .catch(function (error) {
        setMessage("error", error.message);
      });
  });
})();
