const FUTURE_WEATHER_REF_STORAGE_KEY = 'futureweather_ref';
const FUTURE_WEATHER_SIGNUP_URL = 'https://app.futureweather.co/signup';

function normalizeRefValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function getCurrentReferralParam() {
  const searchParams = new URLSearchParams(window.location.search);
  return normalizeRefValue(searchParams.get('ref'));
}

function getStoredReferralParam() {
  try {
    return normalizeRefValue(window.localStorage.getItem(FUTURE_WEATHER_REF_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function capturePartnerReferral() {
  const ref = getCurrentReferralParam();

  if (!ref) {
    return null;
  }

  try {
    window.localStorage.setItem(FUTURE_WEATHER_REF_STORAGE_KEY, ref);
  } catch {
    // Ignore storage failures so signup links still work normally.
  }

  return ref;
}

export function applyPartnerReferralToSignupLinks() {
  const ref = getCurrentReferralParam() || getStoredReferralParam();
  const signupLinks = document.querySelectorAll(
    `a[href="${FUTURE_WEATHER_SIGNUP_URL}"], a[href^="${FUTURE_WEATHER_SIGNUP_URL}?"]`
  );

  signupLinks.forEach((link) => {
    const baseHref = link.dataset.signupBaseHref || link.getAttribute('href');

    if (!baseHref || !baseHref.startsWith(FUTURE_WEATHER_SIGNUP_URL)) {
      return;
    }

    link.dataset.signupBaseHref = baseHref;

    if (!ref) {
      link.href = baseHref;
      return;
    }

    const signupUrl = new URL(baseHref);
    signupUrl.searchParams.set('ref', ref);
    link.href = signupUrl.toString();
  });
}

export function initPartnerReferralTracking() {
  capturePartnerReferral();
  applyPartnerReferralToSignupLinks();
}
