const GA_MEASUREMENT_ID = 'G-SQBML441G9';
const CROSS_DOMAIN_TARGETS = [
  'futureweather.co',
  'www.futureweather.co',
  'app.futureweather.co',
];

let analyticsInitialized = false;

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function loadGoogleTag() {
  const existingScript = document.querySelector(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackEvent(eventName, eventParams = {}) {
  ensureDataLayer();
  window.gtag('event', eventName, eventParams);
}

function trackCrossDomainCtas() {
  document.querySelectorAll('a[href*="app.futureweather.co"]').forEach((link) => {
    link.addEventListener('click', () => {
      const label =
        link.dataset.analyticsLabel ||
        link.textContent.trim().toLowerCase().replace(/\s+/g, '_') ||
        'app_link';

      trackEvent('select_content', {
        content_type: 'cta',
        content_id: label,
        destination_domain: 'app.futureweather.co',
        link_url: link.href,
      });
    });
  });
}

function trackDocsClicks() {
  document.querySelectorAll('[data-analytics-label="nav_api_docs"]').forEach((link) => {
    link.addEventListener('click', () => {
      trackEvent('select_content', {
        content_type: 'navigation',
        content_id: 'nav_api_docs',
      });
    });
  });
}

function submitFormWithAnalytics(form, formName) {
  if (form.dataset.analyticsSubmitting === 'true') {
    return;
  }

  form.dataset.analyticsSubmitting = 'true';

  const fallbackSubmit = window.setTimeout(() => {
    form.submit();
  }, 1000);

  trackEvent('generate_lead', {
    form_name: formName,
    page_location: window.location.href,
    event_callback: () => {
      window.clearTimeout(fallbackSubmit);
      form.submit();
    },
  });
}

function trackLeadForms() {
  const trackedForms = [
    { selector: '#contact-form', formName: 'contact_form' },
    { selector: '#pilot-form', formName: 'pilot_application' },
  ];

  trackedForms.forEach(({ selector, formName }) => {
    const form = document.querySelector(selector);
    if (!form) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitFormWithAnalytics(form, formName);
    });
  });
}

export function initAnalytics() {
  if (analyticsInitialized) {
    return;
  }

  analyticsInitialized = true;
  ensureDataLayer();
  loadGoogleTag();

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    linker: {
      domains: CROSS_DOMAIN_TARGETS,
    },
    transport_type: 'beacon',
  });

  // Home-page hero A/B test: attach the assigned variant so subsequent events
  // (incl. sign-up CTA clicks) are segmentable by variant in GA4.
  let heroVariant = null;
  try {
    heroVariant = localStorage.getItem('fw_hero_ab');
  } catch (e) {
    /* localStorage unavailable */
  }
  if (heroVariant === 'a' || heroVariant === 'b') {
    window.gtag('set', 'user_properties', { hero_variant: heroVariant });
    trackEvent('experiment_impression', {
      experiment_id: 'home_hero_headline',
      variant_id: heroVariant,
    });
  }

  trackCrossDomainCtas();
  trackDocsClicks();
  trackLeadForms();
}
