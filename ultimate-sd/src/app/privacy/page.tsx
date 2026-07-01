import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto p-8 max-w-2xl prose dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p>Last updated: December 23, 2025</p>

            <h2>1. Introduction</h2>
            <p>Welcome to Ultimate SD Practice ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.</p>

            <h2>2. Data We Collect</h2>
            <p>We collect minimal information required to provide our service:</p>
            <ul>
                <li><strong>Account Information:</strong> Email address and name (via Google/GitHub Auth).</li>
                <li><strong>Usage Data:</strong> Progress in practice sessions, XP, and streak data.</li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>We use your data solely to:</p>
            <ul>
                <li>Authenticate you and secure your account.</li>
                <li>Track and display your learning progress.</li>
                <li>Improve our educational content.</li>
            </ul>

            <h2>4. Data Sharing</h2>
            <p>We do not sell your personal data. We only share data with service providers necessary to run the application (e.g., database hosting, authentication providers).</p>

            <h2>5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please reach out through the Ultimate SD website.</p>
        </div>
    );
}
