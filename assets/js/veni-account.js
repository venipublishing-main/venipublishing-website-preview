(() => {
  const app = document.querySelector("[data-veni-account-app]");
  if (!app) return;

  const config = window.VENI_SUPABASE;
  const status = document.querySelector("[data-account-status]");
  const signedIn = [...document.querySelectorAll("[data-signed-in-only]")];
  const signedOut = [...document.querySelectorAll("[data-signed-out-only]")];
  const authViews = [...document.querySelectorAll("[data-auth-view]")];
  const userEmails = [...document.querySelectorAll("[data-user-email]")];

  const setStatus = (message, kind = "info") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = !message;
  };

  const configured =
    config &&
    typeof config.url === "string" &&
    typeof config.publishableKey === "string" &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.publishableKey.includes("YOUR_SB_PUBLISHABLE_KEY");

  if (!configured || !window.supabase?.createClient) {
    setStatus("Stage 2 is installed, but the preview is not yet connected to a dedicated Veni staging Supabase project.", "setup");
    document.documentElement.dataset.accountState = "unconfigured";
    signedIn.forEach(el => el.hidden = true);
    signedOut.forEach(el => el.hidden = false);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  window.veniAccount = { client };

  const getSafeNext = () => {
    const candidates = [
      new URLSearchParams(window.location.search).get("next"),
      (() => { try { return sessionStorage.getItem("veni_after_auth"); } catch { return null; } })()
    ].filter(Boolean);

    for (const raw of candidates) {
      try {
        const url = new URL(raw, window.location.href);
        if (url.origin === window.location.origin) return url.href;
      } catch {}
    }
    return null;
  };

  const rememberNext = () => {
    const next = getSafeNext();
    if (!next) return null;
    try { sessionStorage.setItem("veni_after_auth", next); } catch {}
    return next;
  };

  const redirectAfterAuth = fallback => {
    const next = getSafeNext();
    try { sessionStorage.removeItem("veni_after_auth"); } catch {}
    window.location.href = next || fallback;
  };

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);

  const loadProfile = async (id) => {
    const el = document.querySelector("[data-profile-display-name]");
    if (!el) return;
    const { data } = await client.from("profiles").select("display_name").eq("id", id).maybeSingle();
    el.textContent = data?.display_name || "Veni member";
  };

  const loadLibrary = async () => {
    const list = document.querySelector("[data-library-list]");
    const empty = document.querySelector("[data-library-empty]");
    if (!list) return;
    list.innerHTML = "";

    const { data, error } = await client
      .from("entitlements")
      .select("id,starts_at,ends_at,products(slug,title,platform,product_type,description)")
      .order("created_at", { ascending:false });

    if (error) {
      setStatus("We could not load your library. Please try again.", "error");
      return;
    }

    const items = (data || []).filter(row => row.products);
    if (empty) empty.hidden = items.length > 0;

    items.forEach(row => {
      const p = row.products;
      const card = document.createElement("article");
      card.className = "account-library-card";
      card.innerHTML = `<span>${escapeHtml(p.platform || "Veni Publishing")}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <small>${escapeHtml(p.product_type || "Digital access")}</small>`;
      list.appendChild(card);
    });
  };

  const render = async session => {
    const user = session?.user || null;
    signedIn.forEach(el => el.hidden = !user);
    signedOut.forEach(el => el.hidden = !!user);
    userEmails.forEach(el => el.textContent = user?.email || "");
    authViews.forEach(el => {
      el.hidden = (el.dataset.authView === "signed-in" && !user) ||
                  (el.dataset.authView === "signed-out" && !!user);
    });
    if (user) {
      await loadProfile(user.id);
      await loadLibrary();
    }
  };

  rememberNext();

  document.querySelectorAll("[data-sign-in-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);
      setStatus("Signing you in…");
      const { error } = await client.auth.signInWithPassword({
        email: String(fd.get("email") || "").trim(),
        password: String(fd.get("password") || "")
      });
      if (error) return setStatus(error.message, "error");
      redirectAfterAuth(form.dataset.successUrl || "../");
    });
  });

  document.querySelectorAll("[data-register-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const password = String(fd.get("password") || "");
      if (password.length < 10) return setStatus("Please use a password of at least 10 characters.", "error");

      const next = rememberNext();
      const redirectTo = next || new URL(form.dataset.confirmUrl || "../", window.location.href).href;

      const { data, error } = await client.auth.signUp({
        email: String(fd.get("email") || "").trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { display_name: String(fd.get("display_name") || "").trim() }
        }
      });

      if (error) return setStatus(error.message, "error");
      if (!data.session) return setStatus("Account created. Check your email to confirm your address before signing in.", "success");
      redirectAfterAuth(form.dataset.successUrl || "../");
    });
  });

  document.querySelectorAll("[data-profile-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const { data:{ user } } = await client.auth.getUser();
      if (!user) return;
      const fd = new FormData(form);
      const { error } = await client.from("profiles")
        .update({ display_name: String(fd.get("display_name") || "").trim() })
        .eq("id", user.id);
      setStatus(error ? "We could not save that change." : "Profile updated.", error ? "error" : "success");
      if (!error) await loadProfile(user.id);
    });
  });

  document.querySelectorAll("[data-sign-out]").forEach(button => {
    button.addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.href = button.dataset.redirect || "../";
    });
  });

  client.auth.onAuthStateChange((_event, session) => render(session));
  client.auth.getSession().then(({ data }) => render(data.session));
})();
