import React from 'react';

/**
 * CollaborationSection — "In Collaboration With" single-logo scroll.
 *
 * Logo asset at: /logos/apmsme-logo.png
 * (landing page/frontend/public/logos/apmsme-logo.png)
 *
 * Displays exactly ONE APMSME logo scrolling continuously from right to left.
 * No database or API changes are involved.
 */

const APMSME_LOGO_SRC = '/logos/apmsme-logo.png';
const APMSME_ALT = 'APMSME Development Corporation';

export const CollaborationSection: React.FC = () => {
  return (
    <section className="collaboration-section" aria-label="In Collaboration With">
      {/* Section Heading */}
      <p className="collaboration-heading">IN COLLABORATION WITH</p>

      {/* Single-logo scroll strip */}
      <div className="collaboration-marquee-wrap">
        <div className="collaboration-single-track">
          <img
            src={APMSME_LOGO_SRC}
            alt={APMSME_ALT}
            className="collaboration-logo-img"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
};
