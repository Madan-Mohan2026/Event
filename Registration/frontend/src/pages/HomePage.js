export async function renderHomePage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="home-wrapper">
      <div class="home-bg-glow"></div>

      <!-- Header -->
      <header class="home-nav">
        <div class="home-nav-inner">
          <a href="#home" class="home-brand">
            <div class="home-brand-icon">🏛️</div>
            <div class="home-brand-text">
              <span class="home-brand-title">RTIH Events</span>
            </div>
          </a>

          <div class="home-nav-right">
            <a href="#home" class="home-nav-link active">Home</a>
            <a href="#login/super-admin" class="home-btn-primary">
              Super Admin Login
            </a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="home-hero">
        <div class="home-container">
          <div class="home-hero-content">
            <div class="home-badge">
              <span class="home-badge-dot"></span>
              <span>Centralized Event Platform</span>
            </div>

            <h1 class="home-hero-title">
              RTIH Event Management System
            </h1>

            <p class="home-hero-subtitle">
              A centralized platform to efficiently manage RTIH events, registrations, participant verification, attendance, kit distribution, and food coupon management.
            </p>

            <div class="home-hero-actions">
              <a href="#login/super-admin" class="home-btn-primary home-btn-large">
                Super Admin Login →
              </a>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="home-footer">
        <div class="home-container">
          <div class="home-footer-content">
            <div class="home-footer-left">
              <div class="home-brand">
                <div class="home-brand-icon-sm">🏛️</div>
                <span class="home-footer-brand-name">RTIH Event Management System</span>
              </div>
              <p class="home-footer-desc">
                Regional Technology & Innovation Hub — Centralized Event Management Platform.
              </p>
            </div>
            <div class="home-footer-right">
              <span class="home-status-indicator">
                <span class="home-status-dot"></span>
                System Operational
              </span>
              <p class="home-copyright">
                &copy; ${new Date().getFullYear()} RTIH Events. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;
}
