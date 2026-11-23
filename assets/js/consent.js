/* Documentação: registra a escolha de privacidade e carrega ferramentas opcionais somente após o aceite. */
(() => {
  "use strict";

  const settings = document.currentScript?.dataset || {};
  const consentKey = "guiaPanoramaTrackingConsent";
  const banner = document.getElementById("gpConsentBanner");
  const manageButton = document.getElementById("gpManageConsent");
  const acceptButton = document.getElementById("gpAcceptConsent");
  const rejectButton = document.getElementById("gpRejectConsent");
  let trackingLoaded = false;

  // Inicializa Google Analytics e Google Ads somente depois do aceite.
  function loadGoogleTags() {
    const measurementId = settings.analytics || settings.ads;
    if (!measurementId || !window.gtag) return;
    window.gtag("js", new Date());
    if (settings.analytics) window.gtag("config", settings.analytics);
    if (settings.ads) window.gtag("config", settings.ads);
    const googleScript = document.createElement("script");
    googleScript.async = true;
    googleScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(googleScript);
  }

  // Carrega o contêiner Google Tag Manager após o aceite.
  function loadTagManager() {
    if (!settings.gtm) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const manager = document.createElement("script");
    manager.async = true;
    manager.src = `https://www.googletagmanager.com/gtm.js?id=${settings.gtm}`;
    document.head.appendChild(manager);
  }

  // Inicializa o Meta Pixel e a visualização da página após o aceite.
  function loadMetaPixel() {
    if (!settings.pixel || window.fbq) return;
    const pixel = function () {
      pixel.callMethod
        ? pixel.callMethod.apply(pixel, arguments)
        : pixel.queue.push(arguments);
    };
    window.fbq = pixel;
    window._fbq = pixel;
    pixel.push = pixel;
    pixel.loaded = true;
    pixel.version = "2.0";
    pixel.queue = [];
    const facebookScript = document.createElement("script");
    facebookScript.async = true;
    facebookScript.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(facebookScript);
    window.fbq("init", settings.pixel);
    window.fbq("track", "PageView");
  }

  // Carrega Cloudflare Web Analytics somente depois do aceite.
  function loadCloudflareInsights() {
    if (!settings.insights) return;
    const beacon = document.createElement("script");
    beacon.type = "module";
    beacon.src =
      "https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092";
    beacon.crossOrigin = "anonymous";
    beacon.dataset.cfBeacon = JSON.stringify({
      version: "2024.11.0",
      token: settings.insights,
      spa: 2,
    });
    document.head.appendChild(beacon);
  }

  // Ativa todas as integrações opcionais configuradas para este projeto.
  function loadOptionalTracking() {
    if (trackingLoaded) return;
    trackingLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    loadGoogleTags();
    loadTagManager();
    loadMetaPixel();
    loadCloudflareInsights();
  }

  // Remove cookies conhecidos de medição quando o consentimento é revogado.
  function clearTrackingCookies() {
    ["_ga", "_gid", "_gat", "_gcl_au", "_fbp", "_fbc"].forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.guiapanorama.com.br; SameSite=Lax`;
    });
  }

  // Salva a escolha e atualiza a disponibilidade do painel de preferências.
  function saveConsent(value) {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (_) {
      /* A escolha vale durante esta visita. */
    }
    if (banner) banner.hidden = true;
    if (manageButton) manageButton.hidden = value === "accepted";
    if (value === "accepted") {
      loadOptionalTracking();
    } else if (trackingLoaded) {
      clearTrackingCookies();
      window.location.reload();
    }
  }

  let savedConsent = null;
  try {
    savedConsent = window.localStorage.getItem(consentKey);
  } catch (_) {
    /* O aviso permanece disponível se o armazenamento estiver bloqueado. */
  }
  if (savedConsent === "accepted") {
    if (banner) banner.hidden = true;
    if (manageButton) manageButton.hidden = true;
    loadOptionalTracking();
  } else if (savedConsent === "rejected") {
    if (banner) banner.hidden = true;
    if (manageButton) manageButton.hidden = false;
  } else if (banner) {
    banner.hidden = false;
  }

  acceptButton?.addEventListener("click", () => saveConsent("accepted"));
  rejectButton?.addEventListener("click", () => saveConsent("rejected"));
  manageButton?.addEventListener("click", () => {
    if (banner) banner.hidden = false;
    acceptButton?.focus();
  });
})();
