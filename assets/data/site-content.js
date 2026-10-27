/**
 * TwainMan Ministry International - site content configuration.
 *
 * THE ONE FILE TO EDIT BEFORE LAUNCH.
 *
 * Every page ships with these values already written into the HTML, so the site
 * is complete and readable with JavaScript switched off. On load, `main.js`
 * re-writes any element carrying `data-content="path.to.value"` from this
 * object, so changing a value here updates it across every page.
 *
 * `status` on each group says where the value came from:
 *
 *   'verified'    Taken from the church's own material - the flyer in
 *                 assets/images/_originals/church_events.jpg, the mobile app's
 *                 app.json, or a caption written against a church photograph.
 *   'unconfirmed' Carried over from the mobile app's development sample data.
 *                 Plausible, but nobody has checked it. Confirm or correct.
 *   'placeholder' INVENTED NOTHING - this is a blank that must be filled in by
 *                 the church before the site goes public. Rendered on the page
 *                 as a visible "to confirm" marker, never as a fake value.
 *
 * Nothing in this file may be guessed. If the church has not supplied a fact,
 * it stays 'placeholder' and the page says so.
 *
 * Laravel migration: this object maps onto a `settings` table or a config file;
 * `data-content` attributes become `{{ }}` echoes.
 */

export const PLACEHOLDER = '— to confirm —';

const content = {
  church: {
    status: 'verified',
    /** Full name as set on the church's own flyer. */
    name: 'TwainMan Ministry International',
    /** Short name, as the mobile app uses it (app.json: expo.name). */
    shortName: 'TwainMan Ministry',
    /** From the flyer: "@ Ambrose Omafuvwe Street opposite Building Material Market, OKP Road, Asaba". */
    street: 'Ambrose Omafuvwe Street',
    landmark: 'Opposite Building Material Market, OKP Road',
    city: 'Asaba',
    region: 'Delta State',
    country: 'Nigeria',
    timezone: 'Africa/Lagos',
    get addressOneLine() {
      return `${this.street}, ${this.landmark}, ${this.city}`;
    },
  },

  contact: {
    status: 'placeholder',
    // The mobile app's sample data carries +2348000000000 and an @…example
    // address - both are obviously stand-ins, so neither is reproduced here.
    phone: PLACEHOLDER,
    whatsapp: PLACEHOLDER,
    email: PLACEHOLDER,
    /** Map link. Build from the real coordinates once the church confirms them. */
    directionsUrl: PLACEHOLDER,
  },

  social: {
    status: 'placeholder',
    // No social account has been supplied. Add handles here and the footer
    // renders them; leave them as PLACEHOLDER and the footer hides the row.
    facebook: PLACEHOLDER,
    instagram: PLACEHOLDER,
    youtube: PLACEHOLDER,
    x: PLACEHOLDER,
  },

  gatherings: [
    {
      status: 'unconfirmed',
      name: 'Sunday gathering',
      when: 'Sundays',
      time: PLACEHOLDER,
      note: 'The app refers to Sunday gatherings; the start time has not been supplied.',
    },
    {
      status: 'unconfirmed',
      name: 'Midweek study',
      when: 'Wednesdays',
      time: PLACEHOLDER,
      note: 'The app refers to a midweek study on Wednesdays; the start time has not been supplied.',
    },
    {
      status: 'verified',
      name: 'Blessing the Work of Your Hands',
      when: 'Every second Sunday',
      time: '8:00am',
      note: "The church's own flyer: a monthly service of consecration for the work of our hands. Ministering: Pastor Patrick Evbomoen.",
    },
  ],

  leadership: [
    {
      status: 'verified',
      name: 'Pastor Patrick Evbomoen',
      role: 'Lead Pastor',
      // Named on the church's flyer as the minister for the monthly service,
      // and photographed ministering at Gethsemane Camp Meeting '24.
      bio: PLACEHOLDER,
      photo: 'pastor-portrait',
    },
  ],

  gethsemane: {
    status: 'partly-verified',
    name: 'Gethsemane',
    subtitle: 'Camp Meeting',
    /** '24 is on the badge in the church's own photograph. */
    lastConfirmedEdition: '2024',
    /** Everything below is for the church to fill in for the coming edition. */
    currentEdition: PLACEHOLDER,
    theme: PLACEHOLDER,
    dates: PLACEHOLDER,
    venue: PLACEHOLDER,
    registrationUrl: PLACEHOLDER,
  },

  app: {
    status: 'verified',
    name: 'TwainMan Ministry',
    // From the mobile app's app.json.
    bundleId: 'org.twainman.ministry',
    scheme: 'twainman',
    /** The app is built but not yet confirmed as published on either store. */
    appStoreUrl: PLACEHOLDER,
    playStoreUrl: PLACEHOLDER,
    features: [
      'Sermons and study',
      'Discipleship courses',
      'Events and your calendar',
      'Prayer requests',
      'Community groups',
      'Giving',
      'Announcements',
    ],
  },

  /** Shown in the hero's upper zone. A real passage, quoted in full. */
  scripture: {
    status: 'verified',
    reference: 'Psalm 122:1',
    text: 'I was glad when they said unto me, Let us go into the house of the LORD.',
  },

  /**
   * What is still missing before this site should go public. `main.js` prints
   * this to the console in development so it cannot be quietly forgotten.
   */
  outstanding: [
    'Sunday and midweek service start times',
    'Telephone, WhatsApp and email for the church office',
    'Social media accounts (or confirmation that there are none)',
    "Pastor Patrick Evbomoen's biography, and any other leadership",
    'Gethsemane: current edition year, theme, dates, venue, registration link',
    'Church app: App Store and Google Play links once published',
    'Upcoming events (the Events page shows an empty state until then)',
    'A high-resolution logo file (the current one is lifted off a JPEG flyer)',
    'More photographs - three distinct scenes are all the church has supplied',
  ],
};

export default content;
