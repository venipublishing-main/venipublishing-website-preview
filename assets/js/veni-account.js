(() => {
  const app = document.querySelector("[data-veni-account-app]");
  if (!app) return;

  const config = window.VENI_SUPABASE;
  const status = document.querySelector("[data-account-status]");
  const signedIn = [...document.querySelectorAll("[data-signed-in-only]")];
  const signedOut = [...document.querySelectorAll("[data-signed-out-only]")];
  const authViews = [...document.querySelectorAll("[data-auth-view]")];
  const userEmails = [...document.querySelectorAll("[data-user-email]")];
  const accountNav = [...document.querySelectorAll("[data-account-nav]")];

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
    setStatus("The Veni Account preview is not connected to its staging backend.", "setup");
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

  const markSession = user => {
    document.documentElement.dataset.accountState = user ? "signed-in" : "signed-out";
    accountNav.forEach(link => {
      link.textContent = user ? "My Account" : "Veni Account";
      link.dataset.signedIn = user ? "true" : "false";
    });
  };

  const loadProfile = async id => {
    const display = document.querySelector("[data-profile-display-name]");
    const input = document.querySelector("[data-profile-display-name-input]");
    const { data, error } = await client.from("profiles").select("display_name").eq("id", id).maybeSingle();
    if (error) return;
    const name = data?.display_name || "";
    if (display) display.textContent = name || "Veni member";
    if (input) input.value = name;
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
    markSession(user);
    signedIn.forEach(el => el.hidden = !user);
    signedOut.forEach(el => el.hidden = !!user);
    userEmails.forEach(el => el.textContent = user?.email || "");
    authViews.forEach(el => {
      el.hidden = (el.dataset.authView === "signed-in" && !user) ||
                  (el.dataset.authView === "signed-out" && !!user);
    });

    const emailInput = document.querySelector("[data-account-email-input]");
    if (emailInput && user?.email) emailInput.value = user.email;

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

  document.querySelectorAll("[data-forgot-password-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      const redirectTo = new URL("../reset-password/", window.location.href).href;

      setStatus("Sending password reset email…");
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return setStatus(error.message, "error");

      form.reset();
      setStatus("If that address belongs to a Veni Account, a password reset email has been sent.", "success");
    });
  });

  document.querySelectorAll("[data-reset-password-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const password = String(fd.get("password") || "");
      const confirm = String(fd.get("confirm_password") || "");

      if (password.length < 10) return setStatus("Please use a password of at least 10 characters.", "error");
      if (password !== confirm) return setStatus("The passwords do not match.", "error");

      const { data:{ session } } = await client.auth.getSession();
      if (!session) return setStatus("This reset link is missing or has expired. Request a new one.", "error");

      setStatus("Updating your password…");
      const { error } = await client.auth.updateUser({ password });
      if (error) return setStatus(error.message, "error");

      form.reset();
      setStatus("Password updated. You can continue using your Veni Account.", "success");
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

  document.querySelectorAll("[data-email-change-form]").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      if (!email) return;

      setStatus("Requesting email address change…");
      const { data, error } = await client.auth.updateUser({ email });
      if (error) return setStatus(error.message, "error");

      if (data?.user?.email === email) {
        setStatus("Email address updated.", "success");
      } else {
        setStatus("Email change requested. Check the confirmation messages before the new address becomes active.", "success");
      }
    });
  });

  const deleteInput = document.querySelector("[data-delete-confirmation]");
  const deleteButton = document.querySelector("[data-delete-account]");
  const syncDeleteButton = () => {
    if (!deleteButton) return;
    deleteButton.disabled = String(deleteInput?.value || "").trim() !== "DELETE MY ACCOUNT";
  };
  deleteInput?.addEventListener("input", syncDeleteButton);
  syncDeleteButton();

  deleteButton?.addEventListener("click", async () => {
    if (String(deleteInput?.value || "").trim() !== "DELETE MY ACCOUNT") return;

    const confirmed = window.confirm(
      "Delete this Veni Account permanently? This removes the account and current private Arcana history/journal data. This cannot be undone."
    );
    if (!confirmed) return;

    deleteButton.disabled = true;
    setStatus("Deleting your Veni Account…");

    const { data, error } = await client.functions.invoke("delete-account", { body: {} });
    if (error || !data?.deleted) {
      deleteButton.disabled = false;
      syncDeleteButton();
      return setStatus(data?.error || error?.message || "We could not delete your account.", "error");
    }

    await client.auth.signOut({ scope: "local" }).catch(() => {});
    try {
      sessionStorage.removeItem("veni_after_auth");
      sessionStorage.removeItem("veni_arcana_pending_draw");
    } catch {}
    window.location.href = "../../?account=deleted";
  });

  document.querySelectorAll("[data-sign-out]").forEach(button => {
    button.addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.href = button.dataset.redirect || "../";
    });
  });

  client.auth.onAuthStateChange((event, session) => {
    render(session);
    if (event === "PASSWORD_RECOVERY") {
      setStatus("Recovery link accepted. Choose a new password below.", "success");
    }
  });

  client.auth.getSession().then(({ data }) => render(data.session));
})();