// Text of the two BidConnect texting policy pages on botwerx.ai (/sms-terms, /sms-privacy),
// used by scripts/build-sms-pages.mjs. Wording supplied for Twilio toll-free verification of
// (888) 905-7832, 2026-11-26: keep it exact, including headings. Bold and links are styling.
//
// Paragraphs are trusted HTML written here (not user input). Keep each paragraph on one line:
// the verification checks grep the served HTML for phrases such as
// "Message and data rates may apply", and a line break inside one would hide it.

const ADDRESS_LINE =
  'Botwerx, LLC, 45 S 3rd St., Pacific Beach, WA 98571-5017. Last updated November 26, 2026.';

export const SMS_PAGES = [
  {
    path: 'sms-terms',
    title: 'BidConnect Text Alerts: SMS Terms of Service',
    description:
      'SMS Terms of Service for BidConnect auction text alerts, operated by Botwerx, LLC: what you opt in to, how to stop texts, help, and rates.',
    intro:
      'BidConnect is an online charity auction platform operated by Botwerx, LLC. Nonprofit organizations run auctions on it, and bidders can choose to receive text alerts about their own bidding.',
    sections: [
      {
        heading: 'What you are opting in to',
        paragraphs: [
          'By opting in to text alerts when you register for an auction, you agree to receive notifications from the organization running that auction about your bidding activity, auction updates, and event information: for example, confirmation of a bid, an alert when you are outbid, notice that bidding has closed, and, if you win, a secure payment link. Messages are event-specific and will end after the event concludes. No marketing or promotional messages are sent.',
          'Consent to receive text messages is not a condition of registering, bidding, or making a purchase.',
        ],
      },
      {
        heading: 'Where messages come from',
        paragraphs: [
          'Messages come from the number shown on the auction organization&#39;s own SMS terms page (https://&lt;organization&gt;.bidconnect.app/sms-terms/), or from BidConnect&#39;s numbers +1 (979) 978-0342 and +1 (888) 905-7832.',
        ],
      },
      {
        heading: 'How to stop them',
        paragraphs: [
          'You can opt out at any time by replying <strong>STOP</strong> to the number that texted you. You will receive one message confirming that you have been unsubscribed. To start them again, reply <strong>START</strong> or <strong>UNSTOP</strong> to the same number. You can also turn text alerts off at any time from your account page on the auction&#39;s website.',
        ],
      },
      {
        heading: 'Help',
        paragraphs: [
          'Reply <strong>HELP</strong> for help, or write to <a href="mailto:info@botwerx.ai">info@botwerx.ai</a>.',
        ],
      },
      {
        heading: 'Rates and delivery',
        paragraphs: [
          'Message and data rates may apply. Message frequency varies. Carriers are not liable for delayed or undelivered messages.',
        ],
      },
      {
        heading: 'Privacy',
        paragraphs: [
          'See our SMS Privacy Policy: <a href="https://www.botwerx.ai/sms-privacy">https://www.botwerx.ai/sms-privacy</a>',
        ],
      },
    ],
    closing: ADDRESS_LINE,
  },
  {
    path: 'sms-privacy',
    title: 'BidConnect Text Alerts: SMS Privacy Policy',
    description:
      'SMS Privacy Policy for BidConnect auction text alerts, operated by Botwerx, LLC: how bidders’ mobile numbers are used and kept.',
    intro:
      'BidConnect is an online charity auction platform operated by Botwerx, LLC. This policy covers the mobile numbers bidders give when they opt in to auction text alerts.',
    sections: [
      {
        heading: 'Your mobile number',
        paragraphs: [
          'Your number is used to send you the auction messages you opted in to, and nothing else.',
          '<strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> Information sharing with subcontractors who provide support services, such as message delivery and customer service, is permitted so that the messages can be sent at all.',
        ],
      },
      {
        heading: 'How long it is kept',
        paragraphs: [
          'Your number is kept with your bidder account for as long as that account exists, so that you can be reached about an auction you are taking part in. Turning text alerts off stops the messages; asking the auction organization to close your account removes the number with it.',
        ],
      },
      {
        heading: 'Opting out',
        paragraphs: [
          'Reply <strong>STOP</strong> to any message to stop receiving texts, or turn text alerts off from your account page.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [
          'Write to <a href="mailto:info@botwerx.ai">info@botwerx.ai</a>. See also our SMS Terms of Service: <a href="https://www.botwerx.ai/sms-terms">https://www.botwerx.ai/sms-terms</a>',
        ],
      },
    ],
    closing: ADDRESS_LINE,
  },
];

// Phrases each built page must contain as plain text in its HTML; the build fails without them.
export const REQUIRED_PHRASES = {
  'sms-terms': [
    'Message and data rates may apply',
    'Consent to receive text messages is not a condition of registering, bidding, or making a purchase.',
    'Reply <strong>HELP</strong> for help',
    'info@botwerx.ai',
  ],
  'sms-privacy': [
    'No mobile information will be shared',
    'info@botwerx.ai',
  ],
};
