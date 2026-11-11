import { initAnalytics, trackEvent } from './analytics';
import { initPartnerReferralTracking } from './referral';

// Modal functionality
window.openContactModal = (e) => {
  if (e) e.preventDefault();
  const modal = document.getElementById('contactModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  trackEvent('form_start', {
    form_name: 'contact_form',
    form_destination: 'formspree',
  });
};

window.closeContactModal = () => {
  const modal = document.getElementById('contactModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
};

// Hero headline: cycle the highlighted word with a typewriter effect.
function initHeroTypewriter() {
  const elements = document.querySelectorAll('.hero-typewriter');
  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TYPE_MS = 90;
  const DELETE_MS = 50;
  const HOLD_MS = 1800;

  elements.forEach((el) => {
    const words = (el.getAttribute('data-words') || '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    // Leave the static default word in place when there's nothing to animate.
    if (prefersReducedMotion || words.length <= 1) return;

    let wordIndex = 0;
    let charCount = words[0].length;
    let deleting = true;
    let finalWord = false; // set once we've cycled back to the first word

    const tick = () => {
      const current = words[wordIndex];

      if (deleting) {
        charCount -= 1;
        el.textContent = current.slice(0, charCount);
        if (charCount === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          if (wordIndex === 0) finalWord = true; // back to the start; type it, then stop
        }
        window.setTimeout(tick, DELETE_MS);
      } else {
        charCount += 1;
        el.textContent = current.slice(0, charCount);
        if (charCount === current.length) {
          if (finalWord) {
            el.classList.add('hero-typewriter--done'); // settle on the first word, drop the caret
            return;
          }
          deleting = true;
          window.setTimeout(tick, HOLD_MS);
        } else {
          window.setTimeout(tick, TYPE_MS);
        }
      }
    };

    window.setTimeout(tick, HOLD_MS);
  });
}

// Simple smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
  initAnalytics();
  initPartnerReferralTracking();
  initHeroTypewriter();
  console.log('DOM Content Loaded');
  
  // Parkbeat modal functionality
  const parkbeatModal = document.getElementById('parkbeat-modal');
  const closeParkbeatModal = document.getElementById('close-parkbeat-modal');

  if (parkbeatModal && closeParkbeatModal) {
    // Show modal after a delay if it hasn't been closed
    if (sessionStorage.getItem('parkbeatModalClosed') !== 'true') {
      setTimeout(() => {
        parkbeatModal.classList.remove('hidden');
        // Add class to trigger transition
        setTimeout(() => {
          parkbeatModal.classList.add('visible');
        }, 10);
      }, 2000);
    }

    // Close and remember
    closeParkbeatModal.addEventListener('click', () => {
      parkbeatModal.classList.remove('visible');
      setTimeout(() => {
        parkbeatModal.classList.add('hidden');
      }, 300); // Wait for transition to finish
      sessionStorage.setItem('parkbeatModalClosed', 'true');
    });
  }

  // Landing page announcement popup
  const announcementsPopup = document.getElementById('announcements-popup');
  const closeAnnouncementsPopup = document.getElementById('announcements-popup-close');
  const announcementPopupLinks = document.querySelectorAll('.announcements-popup-link');

  if (announcementsPopup) {
    const announcementPopupStorageKey = 'futureWeatherAnnouncementsClosed';

    const hideAnnouncementsPopup = (rememberChoice = false) => {
      announcementsPopup.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      if (rememberChoice) {
        sessionStorage.setItem(announcementPopupStorageKey, 'true');
      }
    };

    if (window.innerWidth >= 768 && sessionStorage.getItem(announcementPopupStorageKey) !== 'true') {
      setTimeout(() => {
        announcementsPopup.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      }, 2500);
    }

    if (closeAnnouncementsPopup) {
      closeAnnouncementsPopup.addEventListener('click', () => {
        hideAnnouncementsPopup(true);
      });
    }

    announcementPopupLinks.forEach((link) => {
      link.addEventListener('click', () => {
        hideAnnouncementsPopup(true);
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      document.querySelector(targetId).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  console.log('Mobile Menu Button:', mobileMenuButton);
  console.log('Mobile Menu:', mobileMenu);
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('Mobile menu button clicked');
      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
      if (isExpanded) {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
      } else {
        mobileMenu.classList.remove('hidden');
        mobileMenuButton.innerHTML = '<i class="fas fa-times text-2xl"></i>';
      }
    });

    // Prevent menu from closing when clicking inside the menu
    mobileMenu.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenuButton.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
      }
    });
  }

  // Add ESC key support for closing modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactModal();
      // Also close mobile menu when pressing ESC
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenuButton.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
      }
    }
  });

  // Close modal when clicking outside
  const contactModal = document.getElementById('contactModal');
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  // Sidebar navigation active state on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.sidebar-link');

  if (sections.length > 0 && navLinks.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }
});

// Park size selector for pricing
window.selectParkSize = (size) => {
  // Update prices
  const prices = {
    small: { single: '3,000', two: '5,000' },
    medium: { single: '3,500', two: '6,000' },
    large: { single: '4,000', two: '7,000' }
  };

  document.getElementById('price-single').textContent = prices[size].single;
  document.getElementById('price-two').textContent = prices[size].two;
};

// FAQ accordion functionality
window.toggleFaq = (id) => {
  const content = document.getElementById(`faq-content-${id}`);
  const icon = document.getElementById(`faq-icon-${id}`);
  
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    icon.classList.remove('fa-plus');
    icon.classList.add('fa-minus');
  } else {
    content.classList.add('hidden');
    icon.classList.remove('fa-minus');
    icon.classList.add('fa-plus');
  }
};
