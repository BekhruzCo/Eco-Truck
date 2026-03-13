(function () {
  if (document.body.dataset.page !== "learn") return;

  const leaders = [
    { name: "Aziza Karimova", reports: 156, level: 12 },
    { name: "Bobur Rashidov", reports: 142, level: 11 },
    { name: "Dilnoza Saidova", reports: 128, level: 10 },
    { name: "Javohir Toshmatov", reports: 115, level: 9 },
    { name: "Malika Yusupova", reports: 98, level: 8 }
  ];

  const videos = [
    { title: "Plastik chiqindilar va ularning zarari", duration: "2:30", views: "1.2K" },
    { title: "Qayta ishlash jarayoni", duration: "3:15", views: "890" },
    { title: "Daraxt ekish va parvarish qilish", duration: "4:00", views: "2.1K" }
  ];

  const tips = [
    "Har kuni kamida 1 ta plastik shishani qayta ishlashga topshiring.",
    "Elektr energiyasini tejang va keraksiz qurilmalarni o'chiring.",
    "Ko'proq velosipedda yuring yoki jamoat transportidan foydalaning.",
    "Daraxt eking va muntazam parvarish qiling.",
    "Mahallangizdagi tozalik ishlarida faol qatnashing."
  ];

  const quiz = [
    {
      question: "Qaysi odat chiqindini kamaytirishga eng tez yordam beradi?",
      answers: ["Saralash", "Ko'proq plastik ishlatish", "Chiqindini aralashtirish"],
      correct: 0
    },
    {
      question: "Daraxtlarning asosiy foydasi nima?",
      answers: ["Havoni tozalaydi", "Shovqinni ko'paytiradi", "Chiqindini ko'paytiradi"],
      correct: 0
    },
    {
      question: "Qaysi usul ekologik transport hisoblanadi?",
      answers: ["Velosiped", "Bo'sh yuradigan avtomobil", "Ko'p yoqilg'i sarfi"],
      correct: 0
    }
  ];

  const leaderboard = document.getElementById("leaderboard");
  const videoGrid = document.getElementById("video-grid");
  const tipsList = document.getElementById("tips-list");
  const quizBox = document.getElementById("quiz-box");
  let quizIndex = 0;
  let score = 0;

  function renderLeaders(list) {
    leaderboard.innerHTML = list.map(function (user, index) {
      const initials = user.name.split(" ").map(function (part) { return part[0]; }).join("");
      return (
        '<article class="leader-item">' +
        '<div class="leader-rank">#' + (index + 1) + "</div>" +
        '<div class="avatar">' + initials + "</div>" +
        "<div><strong>" + user.name + "</strong><p>" + user.reports + " xabar · Level " + user.level + "</p></div>" +
        '<span class="muted">Faol</span>' +
        "</article>"
      );
    }).join("");
  }

  function renderVideos() {
    videoGrid.innerHTML = videos.map(function (video) {
      return (
        '<article class="video-card">' +
        '<div class="video-thumb">VIDEO</div>' +
        "<h3>" + video.title + "</h3>" +
        "<p>" + video.duration + " · " + video.views + " ko'rish</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderTips() {
    tipsList.innerHTML = tips.map(function (tip, index) {
      return (
        '<article class="tip-card">' +
        '<div class="tip-index">' + (index + 1) + "</div>" +
        "<p>" + tip + "</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderQuiz() {
    const item = quiz[quizIndex];
    if (!item) {
      quizBox.innerHTML = "<strong>Natija: " + score + " / " + quiz.length + "</strong><p>Mini test tugadi.</p>";
      return;
    }

    quizBox.innerHTML =
      "<strong>" + item.question + "</strong>" +
      '<div class="quiz-options">' +
      item.answers.map(function (answer, index) {
        return '<button class="btn btn-secondary wide quiz-answer" type="button" data-answer="' + index + '">' + answer + "</button>";
      }).join("") +
      "</div>";

    quizBox.querySelectorAll("[data-answer]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (Number(button.dataset.answer) === item.correct) score += 1;
        quizIndex += 1;
        renderQuiz();
      });
    });
  }

  document.getElementById("shuffle-leaders").addEventListener("click", function () {
    renderLeaders(leaders.slice().sort(function () { return Math.random() - 0.5; }));
  });

  document.getElementById("start-quiz").addEventListener("click", function () {
    quizIndex = 0;
    score = 0;
    quizBox.classList.remove("hidden");
    renderQuiz();
  });

  renderLeaders(leaders);
  renderVideos();
  renderTips();
})();
