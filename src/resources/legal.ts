import { LegalDocumentContent } from "@/types/legal";

export const legalContent = {
  label: "Legal document",
  lastUpdated: "Last updated:",
  tableOfContents: "Table of Contents",
};

export const privacyPolicy: LegalDocumentContent = {
  title: "Privacy Policy",
  lastUpdated: "12 November 2026",
  intro:
    "This policy explains what information FrameCompile collects when you use our Framer-to-code conversion service, how we use it, and the choices you have.",
  sections: [
    {
      id: "information-we-collect",
      title: "Information we collect",
      blocks: [
        { type: "paragraph", text: "We collect information in the following ways:" },
        { type: "subheading", text: "Information you provide" },
        {
          type: "list",
          items: [
            "Account information - your email address and password when you sign up with email, or your name, email address, profile picture, and Google account ID when you sign in with Google. We store passwords only as a secure hash.",
            "Your choices at sign-up - when you accepted these terms, and whether you agreed to receive product updates and offers, with the dates you gave or withdrew that consent.",
            "Framer site URLs - the live Framer website links you submit for conversion.",
            "Vercel connection - if you connect Vercel to deploy your projects, the access token you provide and your Vercel username. The token is encrypted before it is stored and is used only to deploy projects you choose. You can disconnect at any time.",
            "Payment information - if you subscribe to a paid plan, billing details are collected and processed by our payment processor. We do not store full card numbers on our own servers.",
            "Support communications - anything you send us via email or a contact form.",
          ],
        },
        { type: "subheading", text: "Information collected automatically" },
        {
          type: "list",
          items: [
            "Usage data - the conversions and deployments you run, and when you last signed in.",
            "Log data - IP address, browser type, and the pages and requests made to our servers, kept in our server logs to run and secure the service.",
            "Generated output - the code produced from your submitted URLs, stored in a private repository, and details about each conversion (such as page count, file size, and when it ran).",
          ],
        },
      ],
    },
    {
      id: "how-we-use-your-information",
      title: "How we use your information",
      blocks: [
        { type: "paragraph", text: "We use the information above to:" },
        {
          type: "list",
          items: [
            "Provide, operate, and maintain the conversion service, including running your submitted URLs through our engine and generating code.",
            "Create and manage your account, and process payments for paid plans.",
            "Monitor and improve reliability, performance, and conversion accuracy.",
            "Communicate with you about your account, the service, or support requests.",
            "Send you product updates and offers, only if you agreed to receive them (see \"Marketing emails\" below).",
            "Detect, prevent, and address fraud, abuse, or security issues.",
            "Comply with legal obligations.",
          ],
        },
      ],
    },
    {
      id: "marketing-emails",
      title: "Marketing emails",
      blocks: [
        {
          type: "paragraph",
          text: "We send product updates and offers only if you ticked the box agreeing to receive them when you signed up. Agreeing is optional and doesn't affect your use of the service.",
        },
        {
          type: "paragraph",
          text: "You can unsubscribe at any time with the link at the bottom of every marketing email, or by contacting us. We keep a record of when you agreed and when you unsubscribed. Unsubscribing doesn't stop emails we need to send about your account, such as email verification codes.",
        },
      ],
    },
    {
      id: "framer-urls-and-third-party-sites",
      title: "Framer URLs and third-party sites",
      blocks: [
        {
          type: "paragraph",
          text: "When you submit a Framer website URL, our service fetches the publicly available content of that page in order to generate code. By submitting a URL, you confirm that you own the site or otherwise have the right to convert and reproduce its design and content. We do not verify site ownership automatically, and we are not responsible for URLs submitted without proper authorization.",
        },
        {
          type: "paragraph",
          text: "FrameCompile is an independent tool and is not affiliated with, endorsed by, or sponsored by Framer B.V.",
        },
      ],
    },
    {
      id: "how-we-share-information",
      title: "How we share information",
      blocks: [
        { type: "paragraph", text: "We do not sell your personal information. We may share it with:" },
        {
          type: "list",
          items: [
            "Service providers who help us operate the platform - hosting, our database, code storage (converted projects are kept in private GitHub repositories), email delivery, and payment processing - under terms that limit their use of your data to providing services to us.",
            "Vercel - when you choose to deploy a project, we send its code to your own Vercel account using the token you provided.",
            "Legal and safety purposes - if required by law, subpoena, or to protect the rights, property, or safety of FrameCompile, our users, or others.",
            "Business transfers - if we're involved in a merger, acquisition, or sale of assets, information may be transferred as part of that transaction.",
          ],
        },
      ],
    },
    {
      id: "cookies-and-similar-technologies",
      title: "Cookies and similar technologies",
      blocks: [
        {
          type: "paragraph",
          text: "We use only the cookies the service needs to work: one that keeps you signed in, and a short-lived one that protects the Google sign-in process. We don't use advertising or analytics cookies. You can control cookies through your browser settings; blocking them will stop you from staying signed in.",
        },
      ],
    },
    {
      id: "data-retention",
      title: "Data retention",
      blocks: [
        {
          type: "paragraph",
          text: 'We retain account information for as long as your account is active. Submitted URLs and generated code are retained to let you access your conversion history; you can delete a conversion at any time, which also deletes its code. Conversions that fail because the URL was invalid or not a Framer site are deleted automatically after an hour. You can request deletion of your account at any time - see "Your rights and choices" below.',
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        {
          type: "paragraph",
          text: "We use industry-standard measures - encryption in transit, access controls, and regular review of our systems - to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
        },
      ],
    },
    {
      id: "your-rights-and-choices",
      title: "Your rights and choices",
      blocks: [
        { type: "paragraph", text: "Depending on where you live, you may have the right to:" },
        {
          type: "list",
          items: [
            "Access the personal information we hold about you.",
            "Correct inaccurate information.",
            "Request deletion of your account and associated data.",
            "Export your data in a portable format.",
            "Object to or restrict certain processing.",
            "Withdraw consent, where processing is based on consent, such as marketing emails.",
          ],
        },
        {
          type: "paragraph",
          text: "To exercise any of these rights, contact us at the email below. We may need to verify your identity before completing your request.",
        },
      ],
    },
    {
      id: "international-data-transfers",
      title: "International data transfers",
      blocks: [
        {
          type: "paragraph",
          text: "We may process and store information in countries other than where you live. Where required, we rely on appropriate safeguards (such as standard contractual clauses) for transfers of personal data across borders.",
        },
      ],
    },
    {
      id: "childrens-privacy",
      title: "Children's privacy",
      blocks: [
        {
          type: "paragraph",
          text: "FrameCompile is not directed to children under 16, and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, please contact us so we can delete it.",
        },
      ],
    },
    {
      id: "changes-to-this-policy",
      title: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          text: 'We may update this policy from time to time. If we make material changes, we\'ll notify you by email or through the service before the changes take effect. The "Last updated" date at the top reflects the most recent revision.',
        },
      ],
    },
    {
      id: "contact-us",
      title: "Contact us",
      blocks: [
        {
          type: "paragraph",
          text: "If you have questions about this policy or how we handle your information, reach out at",
          link: { text: "framecompile@gmail.com", href: "mailto:framecompile@gmail.com" },
        },
      ],
    },
  ],
};

export const termsOfService: LegalDocumentContent = {
  title: "Terms of Service",
  lastUpdated: "12 November 2026",
  intro:
    "These terms govern your use of FrameCompile, our tool for converting Framer websites into code. By using the service, you agree to these terms.",
  sections: [
    {
      id: "acceptance-of-terms",
      title: "Acceptance of terms",
      blocks: [
        {
          type: "paragraph",
          text: 'By creating an account or otherwise using FrameCompile (the "Service"), you agree to be bound by these Terms of Service and our Privacy Policy. If you\'re using the Service on behalf of a company, you\'re agreeing on that company\'s behalf and confirming you have the authority to do so.',
        },
      ],
    },
    {
      id: "the-service",
      title: "The service",
      blocks: [
        {
          type: "paragraph",
          text: "FrameCompile converts publicly accessible Framer websites into code, such as a Next.js project, based on a URL you submit. Conversion accuracy depends on the structure of the source site, and we don't guarantee that generated output will be pixel-perfect, complete, or free of errors. You're responsible for reviewing and testing generated code before using it in production.",
        },
      ],
    },
    {
      id: "accounts",
      title: "Accounts",
      blocks: [
        {
          type: "paragraph",
          text: "You must provide accurate information when creating an account and keep your login credentials secure. You're responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access.",
        },
      ],
    },
    {
      id: "acceptable-use-and-your-content",
      title: "Acceptable use and your content",
      blocks: [
        { type: "paragraph", text: "You agree not to use the Service to:" },
        {
          type: "list",
          items: [
            "Submit URLs for sites you don't own and don't have permission to convert or reproduce.",
            "Infringe on the intellectual property, privacy, or other rights of any third party.",
            "Attempt to disrupt, overload, or gain unauthorized access to our systems.",
            "Use the Service to build tools that compete with or scrape FrameCompile itself.",
            "Violate any applicable law or regulation.",
          ],
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual property",
      blocks: [
        {
          type: "paragraph",
          text: "Your output. Subject to these terms, you own the code generated from URLs you submit, provided you had the right to submit them in the first place.",
        },
        {
          type: "paragraph",
          text: "Our platform. FrameCompile, including its conversion engine, branding, and website, is owned by us and protected by intellectual property laws. These terms don't grant you any rights to our platform beyond using the Service as intended.",
        },
      ],
    },
    {
      id: "relationship-to-framer",
      title: "Relationship to Framer",
      blocks: [
        {
          type: "paragraph",
          text: 'FrameCompile is an independent, third-party tool and is not affiliated with, endorsed by, or sponsored by Framer B.V. "Framer" is referenced solely to describe compatibility with sites built on that platform.',
        },
      ],
    },
    {
      id: "fees-and-payment",
      title: "Fees and payment",
      blocks: [
        {
          type: "paragraph",
          text: "Some features of the Service require a paid subscription. Fees are billed in advance on a recurring basis unless stated otherwise, and are non-refundable except where required by law. We may change our pricing with advance notice; continued use after a price change constitutes acceptance of the new pricing.",
        },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      blocks: [
        {
          type: "paragraph",
          text: 'The Service is provided "as is" and "as available," without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We don\'t warrant that the Service will be uninterrupted, error-free, or that generated code will be fully compatible with your intended hosting environment.',
        },
      ],
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of liability",
      blocks: [
        {
          type: "paragraph",
          text: "To the maximum extent permitted by law, FrameCompile and its team won't be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or business arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the amount you paid us in the twelve months before the claim arose.",
        },
      ],
    },
    {
      id: "indemnification",
      title: "Indemnification",
      blocks: [
        {
          type: "paragraph",
          text: "You agree to indemnify and hold FrameCompile harmless from any claims, damages, or expenses arising from your use of the Service, your violation of these terms, or your infringement of any third party's rights (including submitting a URL you didn't have the right to convert).",
        },
      ],
    },
    {
      id: "termination",
      title: "Termination",
      blocks: [
        {
          type: "paragraph",
          text: "You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you violate these terms, misuse the Service, or for any other reason with reasonable notice. Sections that by their nature should survive termination (like IP ownership and limitation of liability) will continue to apply.",
        },
      ],
    },
    {
      id: "governing-law",
      title: "Governing law",
      blocks: [
        {
          type: "paragraph",
          text: "These terms are governed by the laws of [your company's jurisdiction - to be filled in], without regard to conflict-of-law principles. Disputes will be resolved in the courts of that jurisdiction, unless otherwise required by applicable law.",
        },
      ],
    },
    {
      id: "changes-to-these-terms",
      title: "Changes to these terms",
      blocks: [
        {
          type: "paragraph",
          text: "We may update these terms from time to time. If we make material changes, we'll notify you by email or through the Service before the changes take effect. Continued use of the Service after changes take effect means you accept the updated terms.",
        },
      ],
    },
    {
      id: "contact-us",
      title: "Contact us",
      blocks: [
        {
          type: "paragraph",
          text: "Questions about these terms can be sent to",
          link: { text: "framecompile@gmail.com", href: "mailto:framecompile@gmail.com" },
        },
      ],
    },
  ],
};
