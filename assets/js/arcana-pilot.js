(() => {
  const app = document.querySelector("[data-arcana-pilot]");
  if (!app) return;

  const config = window.VENI_SUPABASE;
  const configured =
    config &&
    typeof config.url === "string" &&
    typeof config.publishableKey === "string" &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.publishableKey.includes("YOUR_SB_PUBLISHABLE_KEY") &&
    window.supabase?.createClient;

  const status = document.querySelector("[data-arcana-status]");
  const setStatus = (message, kind = "info") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = !message;
  };

  if (!configured) {
    setStatus("The Arcana pilot is not connected to its staging backend.", "error");
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const mode = app.dataset.arcanaPilot;
  let session = null;
  let cards = [];
  let currentCard = null;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);

  const getSafeNext = () => {
    try {
      const raw = new URLSearchParams(window.location.search).get("next");
      if (!raw) return null;
      const url = new URL(raw, window.location.href);
      return url.origin === window.location.origin ? url.href : null;
    } catch {
      return null;
    }
  };

  const signInUrl = () => {
    const target = encodeURIComponent(window.location.href);
    return `../../account/sign-in/?next=${target}`;
  };

  const formatDate = value => {
    try {
      return new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return value || "";
    }
  };

  const getSession = async () => {
    const { data } = await client.auth.getSession();
    session = data.session || null;
    document.documentElement.dataset.arcanaAuth = session ? "signed-in" : "signed-out";
    document.querySelectorAll("[data-arcana-signed-in]").forEach(el => el.hidden = !session);
    document.querySelectorAll("[data-arcana-signed-out]").forEach(el => el.hidden = !!session);
    return session;
  };

  const loadCards = async () => {
    const { data, error } = await client
      .from("arcana_cards")
      .select("id,slug,deck_order,number_label,display_name,short_meaning,reflection_prompt,content_stage")
      .order("deck_order", { ascending: true });

    if (error) throw error;
    cards = data || [];
    if (!cards.length) throw new Error("No pilot cards are currently available.");
  };

  const randomCard = () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const index = Math.floor((buffer[0] / 4294967296) * cards.length);
    return cards[index];
  };

  const savePending = (card, question) => {
    try {
      sessionStorage.setItem("veni_arcana_pending_draw", JSON.stringify({
        cardId: card.id,
        question: question || "",
        savedAt: Date.now()
      }));
    } catch {}
  };

  const restorePending = () => {
    try {
      const raw = sessionStorage.getItem("veni_arcana_pending_draw");
      if (!raw) return null;
      const pending = JSON.parse(raw);
      if (!pending?.cardId) return null;
      if (Date.now() - (pending.savedAt || 0) > 1000 * 60 * 60 * 6) {
        sessionStorage.removeItem("veni_arcana_pending_draw");
        return null;
      }
      return pending;
    } catch {
      return null;
    }
  };

  const clearPending = () => {
    try { sessionStorage.removeItem("veni_arcana_pending_draw"); } catch {}
  };

  const renderDraw = (card, question = "") => {
    currentCard = card;
    const stage = document.querySelector("[data-card-stage]");
    const result = document.querySelector("[data-card-result]");
    const name = document.querySelector("[data-card-name]");
    const number = document.querySelector("[data-card-number]");
    const meaning = document.querySelector("[data-card-meaning]");
    const prompt = document.querySelector("[data-card-prompt]");
    const contentStage = document.querySelector("[data-card-content-stage]");
    const questionOut = document.querySelector("[data-card-question]");
    const saveArea = document.querySelector("[data-save-area]");

    if (stage) stage.dataset.revealed = "true";
    if (result) result.hidden = false;
    if (name) name.textContent = card.display_name;
    if (number) number.textContent = card.number_label || "·";
    if (meaning) meaning.textContent = card.short_meaning || "Interpretive copy is still being integrated from the Veni Arcana research dossiers.";
    if (prompt) prompt.textContent = card.reflection_prompt || "What does this image or title bring into focus for you?";
    if (contentStage) contentStage.textContent = card.content_stage === "canonical" ? "Canonical interpretation" : "Pilot interpretation";
    if (questionOut) {
      questionOut.textContent = question ? `Your focus: ${question}` : "Open reflection";
      questionOut.hidden = false;
    }
    if (saveArea) saveArea.hidden = false;

    const saveButton = document.querySelector("[data-save-reading]");
    if (saveButton) saveButton.textContent = session ? "Save reading" : "Sign in to save & journal";
  };

  const initDraw = async () => {
    const drawButton = document.querySelector("[data-draw-card]");
    const againButton = document.querySelector("[data-draw-again]");
    const saveButton = document.querySelector("[data-save-reading]");
    const questionInput = document.querySelector("[data-draw-question]");
    const noteInput = document.querySelector("[data-journal-note]");

    try {
      await Promise.all([getSession(), loadCards()]);
      setStatus("");

      const pending = restorePending();
      if (pending) {
        const card = cards.find(c => c.id === pending.cardId);
        if (card) {
          if (questionInput) questionInput.value = pending.question || "";
          renderDraw(card, pending.question || "");
          if (session) setStatus("Your draw was restored after sign-in. You can save it now.", "success");
        }
      }
    } catch (error) {
      setStatus(error.message || "The Arcana pilot could not be loaded.", "error");
      if (drawButton) drawButton.disabled = true;
      return;
    }

    const doDraw = () => {
      const question = String(questionInput?.value || "").trim().slice(0, 1000);
      const card = randomCard();
      renderDraw(card, question);
      savePending(card, question);
      if (noteInput) noteInput.value = "";
      setStatus("Card drawn. Read it as a reflective prompt, not as a factual prediction.", "info");
    };

    drawButton?.addEventListener("click", doDraw);
    againButton?.addEventListener("click", doDraw);

    saveButton?.addEventListener("click", async () => {
      if (!currentCard) return;
      const question = String(questionInput?.value || "").trim().slice(0, 1000);
      const note = String(noteInput?.value || "").trim().slice(0, 10000);
      savePending(currentCard, question);

      if (!session) {
        window.location.href = signInUrl();
        return;
      }

      saveButton.disabled = true;
      setStatus("Saving your reading…");

      const { data, error } = await client.rpc("save_arcana_single_card_reading", {
        p_card_id: currentCard.id,
        p_question: question || null,
        p_note: note || null
      });

      saveButton.disabled = false;

      if (error) {
        setStatus(error.message || "We could not save this reading.", "error");
        return;
      }

      clearPending();
      setStatus("Reading saved to your private Arcana history.", "success");
      saveButton.textContent = "Saved";
      saveButton.disabled = true;

      const savedLink = document.querySelector("[data-saved-reading-link]");
      if (savedLink) {
        savedLink.hidden = false;
        savedLink.href = "../readings/";
        savedLink.textContent = "Open saved readings";
      }
    });

    client.auth.onAuthStateChange((_event, nextSession) => {
      session = nextSession || null;
      const saveButtonNow = document.querySelector("[data-save-reading]");
      if (saveButtonNow && !saveButtonNow.disabled) {
        saveButtonNow.textContent = session ? "Save reading" : "Sign in to save & journal";
      }
    });
  };

  const requireSessionOrPrompt = async () => {
    await getSession();
    const signedOut = document.querySelector("[data-auth-required]");
    const content = document.querySelector("[data-auth-content]");
    if (!session) {
      if (signedOut) signedOut.hidden = false;
      if (content) content.hidden = true;
      const link = signedOut?.querySelector("a");
      if (link) link.href = signInUrl();
      return false;
    }
    if (signedOut) signedOut.hidden = true;
    if (content) content.hidden = false;
    return true;
  };

  const initReadings = async () => {
    if (!(await requireSessionOrPrompt())) return;
    setStatus("Loading saved readings…");

    const { data, error } = await client
      .from("arcana_readings")
      .select(`
        id,title,question,created_at,
        arcana_reading_cards(
          position_label,orientation,
          arcana_cards(number_label,display_name,short_meaning,reflection_prompt)
        ),
        arcana_journal_entries(id,body,created_at)
      `)
      .order("created_at", { ascending:false });

    if (error) return setStatus("We could not load your saved readings.", "error");

    const list = document.querySelector("[data-readings-list]");
    const empty = document.querySelector("[data-readings-empty]");
    if (!list) return;
    list.innerHTML = "";

    if (!data?.length) {
      if (empty) empty.hidden = false;
      setStatus("");
      return;
    }

    if (empty) empty.hidden = true;

    data.forEach(reading => {
      const cardRow = reading.arcana_reading_cards?.[0];
      const card = cardRow?.arcana_cards;
      const journal = reading.arcana_journal_entries?.[0];
      const article = document.createElement("article");
      article.className = "arcana-history-card";
      article.innerHTML = `
        <div class="arcana-history-meta">
          <span>${escapeHtml(formatDate(reading.created_at))}</span>
          <span>${escapeHtml(cardRow?.orientation || "upright")}</span>
        </div>
        <div class="arcana-history-cardname">
          <span>${escapeHtml(card?.number_label || "·")}</span>
          <h2>${escapeHtml(card?.display_name || reading.title)}</h2>
        </div>
        ${reading.question ? `<p class="arcana-history-question"><strong>Focus:</strong> ${escapeHtml(reading.question)}</p>` : ""}
        ${card?.reflection_prompt ? `<p>${escapeHtml(card.reflection_prompt)}</p>` : ""}
        ${journal?.body ? `<blockquote>${escapeHtml(journal.body)}</blockquote>` : `<p class="arcana-muted">No journal note was saved with this reading.</p>`}
      `;
      list.appendChild(article);
    });

    setStatus("");
  };

  const initJournal = async () => {
    if (!(await requireSessionOrPrompt())) return;
    setStatus("Loading journal…");

    const { data, error } = await client
      .from("arcana_journal_entries")
      .select(`
        id,body,created_at,
        arcana_readings(
          id,title,question,created_at,
          arcana_reading_cards(
            position_label,orientation,
            arcana_cards(number_label,display_name)
          )
        )
      `)
      .order("created_at", { ascending:false });

    if (error) return setStatus("We could not load your journal.", "error");

    const list = document.querySelector("[data-journal-list]");
    const empty = document.querySelector("[data-journal-empty]");
    if (!list) return;
    list.innerHTML = "";

    if (!data?.length) {
      if (empty) empty.hidden = false;
      setStatus("");
      return;
    }

    if (empty) empty.hidden = true;

    data.forEach(entry => {
      const reading = entry.arcana_readings;
      const card = reading?.arcana_reading_cards?.[0]?.arcana_cards;
      const article = document.createElement("article");
      article.className = "arcana-journal-card";
      article.innerHTML = `
        <div class="arcana-history-meta"><span>${escapeHtml(formatDate(entry.created_at))}</span><span>Private journal</span></div>
        <h2>${escapeHtml(card?.display_name || reading?.title || "Arcana reflection")}</h2>
        ${reading?.question ? `<p class="arcana-history-question"><strong>Focus:</strong> ${escapeHtml(reading.question)}</p>` : ""}
        <blockquote>${escapeHtml(entry.body)}</blockquote>
      `;
      list.appendChild(article);
    });

    setStatus("");
  };

  if (mode === "draw") initDraw();
  if (mode === "readings") initReadings();
  if (mode === "journal") initJournal();
})();
