import { Link } from 'react-router-dom'
import { LegalLayout, LegalList, LegalSection } from '../components/layout/LegalLayout'
import { authLink } from '../components/auth/AuthLayout'

const CONTACT = 'support@synchrome.co'

export function PrivacyPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Privacy Policy" updated="16 October 2026">
      <LegalSection title="Overview">
        <p>
          Sawari (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a learning platform at
          sawari.synchrome.co. This policy explains what we collect, how we use it, and the choices
          you have. By using Sawari you agree to this policy.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <LegalList
          items={[
            'Account details: your name, email address, and a hashed password.',
            'Sign-in providers: if you sign in with Google or GitHub, we receive your basic profile (name, email address, and profile picture). We never receive your password.',
            'Learning data: the subjects and paths you create, your sessions, progress, settings, and anything you submit.',
            'Technical data: a session cookie, your IP address, and basic server logs used to keep the service secure and working.',
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use your information">
        <LegalList
          items={[
            'To create and secure your account and sign you in.',
            'To build and personalise your learning paths and sessions.',
            'To send transactional email such as verification, password resets, and reminders.',
            'To protect the service, prevent abuse, and provide support.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Google user data">
        <p>
          We use Google Sign-In only to create and authenticate your account. We access your basic
          profile (name, email address, and profile picture) and nothing else — we do not access
          Gmail, Drive, Calendar, or any other Google data.
        </p>
        <p>
          Our use of Google user data adheres to the Google API Services User Data Policy, including
          the <strong>Limited Use</strong> requirements. We do not sell Google user data, and we do
          not transfer it to others except as needed to operate the service or as required by law.
        </p>
      </LegalSection>

      <LegalSection title="Sharing and service providers">
        <p>
          We do not sell your personal data. We share it only with providers that help us run Sawari,
          each under their own terms:
        </p>
        <LegalList
          items={[
            'MongoDB Atlas — stores your account and learning data.',
            'Resend — delivers transactional email.',
            'DeepSeek — powers AI learning-path generation.',
            'Cloudflare — provides DNS and network protection.',
            'PayPal — processes one-time payments.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use a single essential cookie to keep you signed in. It is HTTP-only and secure. We do
          not use advertising or third-party tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="Data retention and deletion">
        <p>
          We keep your data while your account is active. You can delete your account at any time
          from <Link to="/delete-account" className={authLink}>your account settings</Link>. Deleted
          accounts can be restored for a short grace period, after which the data is permanently
          removed.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We protect your data with encryption in transit, hashed passwords, restricted database
          access, and limited internal access. No method is perfectly secure, but we work to keep
          your information safe.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can access, correct, export, or delete your information. To make a request, contact us
          and we will respond within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Sawari is not intended for anyone under 13, and we do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be reflected by the
          &ldquo;last updated&rdquo; date above.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy? Email us at{' '}
          <a href={`mailto:${CONTACT}`} className={authLink}>
            {CONTACT}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
