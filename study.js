(function () {
  "use strict";

  var state = {
    clue: null,
    revealed: false,
    error: null
  };

  var els = {};

  // Shrinks the clue/solution text until everything fits inside the clue
  // area, so long clues never push the button off-screen.
  function fitClueText() {
    var area = document.getElementById("clueArea");
    var MAX_PX = 32;
    var MIN_PX = 14;
    var size = MAX_PX;

    function apply(px) {
      els.clueText.style.fontSize = px + "px";
      els.solution.style.fontSize = Math.max(MIN_PX, Math.round(px * 0.85)) + "px";
    }

    apply(size);
    while (area.scrollHeight > area.clientHeight && size > MIN_PX) {
      size -= 1;
      apply(size);
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function loadAllCluePartsThen(onDone) {
    var parts = window.JEOPARDY_CLUES_PARTS || [];
    if (parts.length === 0) {
      state.error = "clues_manifest.js not loaded, or lists no parts.";
      render();
      return;
    }
    var chain = Promise.resolve();
    parts.forEach(function (src) {
      chain = chain.then(function () { return loadScript(src); });
    });
    chain.then(onDone).catch(function (err) {
      state.error = "Failed to load clue data: " + err.message;
      render();
    });
  }

  function cacheEls() {
    els.category = document.getElementById("category");
    els.value = document.getElementById("value");
    els.clueText = document.getElementById("clueText");
    els.solution = document.getElementById("solution");
    els.actionBtn = document.getElementById("actionBtn");
  }

  function loadNewClue() {
    var data = window.JEOPARDY_CLUES;
    if (!data || data.length === 0) {
      state.error = "No clues loaded \u2014 are the clues_data_part files in the same folder as study.html?";
      state.clue = null;
      render();
      return;
    }
    state.error = null;
    state.clue = data[Math.floor(Math.random() * data.length)];
    state.revealed = false;
    render();
  }

  function onActionClick() {
    if (state.error || !state.clue) return;
    if (!state.revealed) {
      state.revealed = true;
      render();
    } else {
      loadNewClue();
    }
  }

  function render() {
    if (state.error) {
      els.category.textContent = "ERROR";
      els.clueText.textContent = state.error;
      els.value.textContent = "";
      els.solution.hidden = true;
    } else if (state.clue) {
      els.category.textContent = state.clue.category.toUpperCase();
      els.value.textContent = "$" + state.clue.value;
      els.clueText.textContent = state.clue.clue.toUpperCase();

      if (state.revealed) {
        els.solution.textContent = state.clue.answer.toUpperCase();
        els.solution.hidden = false;
      } else {
        els.solution.hidden = true;
      }

      fitClueText();
    }

    els.actionBtn.textContent = state.revealed ? "NEXT CLUE" : "REVEAL SOLUTION";
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheEls();
    els.actionBtn.addEventListener("click", onActionClick);
    window.addEventListener("resize", fitClueText);
    loadAllCluePartsThen(loadNewClue);
  });
})();
