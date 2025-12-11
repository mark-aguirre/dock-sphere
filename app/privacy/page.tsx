import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { BackToTop } from '@/components/terms/BackToTop';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/auth/signin" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">How we collect, use, and protect your information</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Last updated: December 11, 2024</span>
            </div>
            <Badge variant="outline">Version 1.0</Badge>
            <span>Effective: December 11, 2024</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Table of Contents */}
        <div className="mb-8 p-6 bg-card border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#information-we-collect" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              1. Information We Collect
            </a>
            <a href="#how-we-use-information" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              2. How We Use Your Information
            </a>
            <a href="#information-sharing" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              3. Information Sharing and Disclosure
            </a>
            <a href="#data-security" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              4. Data Security
            </a>
            <a href="#data-retention" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              5. Data Retention
            </a>
            <a href="#your-rights" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              6. Your Rights and Choices
            </a>
            <a href="#cookies" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              7. Cookies and Tracking Technologies
            </a>
            <a href="#international-transfers" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              8. International Data Transfers
            </a>
            <a href="#children-privacy" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              9. Children's Privacy
            </a>
            <a href="#changes-to-policy" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              10. Changes to This Privacy Policy
            </a>
            <a href="#contact-us" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              11. Contact Us
            </a>
          </nav>
        </div>

        <Separator className="mb-8" />

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Information We Collect */}
          <section id="information-we-collect" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">1.</span>
              Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">1.1 Information You Provide</h3>
                <p className="mb-4 text-muted-foreground">We collect information you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Account registration information (email address, username)</li>
                  <li>Authentication credentials and profile information</li>
                  <li>Container configurations and deployment settings</li>
                  <li>Support requests and communications with us</li>
                  <li>Feedback, surveys, and other voluntary submissions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">1.2 Information We Collect Automatically</h3>
                <p className="mb-4 text-muted-foreground">When you use DockSphere, we automatically collect:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Usage data and application interactions</li>
                  <li>Container performance metrics and resource usage</li>
                  <li>Log files and system events</li>
                  <li>IP addresses and device information</li>
                  <li>Browser type, operating system, and access times</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">1.3 Information from Third Parties</h3>
                <p className="mb-4 text-muted-foreground">We may receive information from:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>OAuth providers (Google, GitHub, GitLab) for authentication</li>
                  <li>Container registries and external services you connect</li>
                  <li>Analytics and monitoring services</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section id="how-we-use-information" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">2.</span>
              How We Use Your Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">2.1 Service Provision</h3>
                <p className="mb-4 text-muted-foreground">We use your information to:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Provide and maintain the DockSphere platform</li>
                  <li>Process your container management requests</li>
                  <li>Monitor system performance and resource usage</li>
                  <li>Provide customer support and technical assistance</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">2.2 Service Improvement</h3>
                <p className="mb-4 text-muted-foreground">We analyze usage data to:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Improve platform functionality and user experience</li>
                  <li>Develop new features and capabilities</li>
                  <li>Identify and fix bugs and performance issues</li>
                  <li>Conduct research and analytics</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">2.3 Security and Compliance</h3>
                <p className="mb-4 text-muted-foreground">We process information to:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Detect and prevent security threats</li>
                  <li>Investigate suspicious activities</li>
                  <li>Comply with legal obligations</li>
                  <li>Enforce our terms of service</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section id="information-sharing" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">3.</span>
              Information Sharing and Disclosure
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">3.1 We Do Not Sell Your Data</h3>
                <p className="mb-4 text-muted-foreground">
                  DockSphere does not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">3.2 Limited Sharing</h3>
                <p className="mb-4 text-muted-foreground">We may share information in these limited circumstances:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a business transfer or acquisition</li>
                  <li>With service providers who assist in platform operations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section id="data-security" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">4.</span>
              Data Security
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">4.1 Security Measures</h3>
                <p className="mb-4 text-muted-foreground">We implement comprehensive security measures:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Multi-factor authentication and access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Employee training on data protection practices</li>
                  <li>Incident response and breach notification procedures</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">4.2 Data Breach Response</h3>
                <p className="mb-4 text-muted-foreground">
                  In the event of a data breach, we will notify affected users and relevant authorities 
                  within 72 hours as required by applicable laws.
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">5.</span>
              Data Retention
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">5.1 Retention Periods</h3>
                <p className="mb-4 text-muted-foreground">We retain your information for different periods:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Account information: Until account deletion</li>
                  <li>Usage logs: 90 days for operational purposes</li>
                  <li>Security logs: 1 year for security monitoring</li>
                  <li>Support communications: 3 years for service improvement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">5.2 Data Deletion</h3>
                <p className="mb-4 text-muted-foreground">
                  When you delete your account, we will remove your personal information within 30 days, 
                  except where retention is required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section id="your-rights" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">6.</span>
              Your Rights and Choices
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">6.1 Access and Control</h3>
                <p className="mb-4 text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data in a portable format</li>
                  <li>Restrict or object to certain processing activities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">6.2 Exercising Your Rights</h3>
                <p className="mb-4 text-muted-foreground">
                  To exercise these rights, contact us at privacy@docksphere.com. 
                  We will respond to your request within 30 days.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section id="cookies" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">7.</span>
              Cookies and Tracking Technologies
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">7.1 Types of Cookies</h3>
                <p className="mb-4 text-muted-foreground">We use the following types of cookies:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Essential cookies for platform functionality</li>
                  <li>Authentication cookies for user sessions</li>
                  <li>Preference cookies for user settings</li>
                  <li>Analytics cookies for usage insights</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">7.2 Cookie Management</h3>
                <p className="mb-4 text-muted-foreground">
                  You can control cookies through your browser settings. Note that disabling 
                  essential cookies may affect platform functionality.
                </p>
              </div>
            </div>
          </section>

          {/* International Transfers */}
          <section id="international-transfers" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">8.</span>
              International Data Transfers
            </h2>
            
            <p className="mb-4 text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data during international transfers, 
              including standard contractual clauses and adequacy decisions.
            </p>
          </section>

          {/* Children's Privacy */}
          <section id="children-privacy" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">9.</span>
              Children's Privacy
            </h2>
            
            <p className="mb-4 text-muted-foreground">
              DockSphere is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If we become aware that we have 
              collected such information, we will take steps to delete it promptly.
            </p>
          </section>

          {/* Changes to Policy */}
          <section id="changes-to-policy" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">10.</span>
              Changes to This Privacy Policy
            </h2>
            
            <p className="mb-4 text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the "Last Updated" 
              date. Your continued use of DockSphere after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section id="contact-us" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">11.</span>
              Contact Us
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">11.1 Privacy Inquiries</h3>
                <p className="mb-4 text-muted-foreground">For privacy-related questions or concerns:</p>
                <div className="p-4 bg-card border border-border rounded-lg text-muted-foreground">
                  <p><strong>Email:</strong> privacy@docksphere.com</p>
                  <p><strong>Address:</strong> DockSphere Privacy Officer</p>
                  <p>123 Container Street</p>
                  <p>Docker City, DC 12345</p>
                  <p>United States</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">11.2 Data Protection Officer</h3>
                <p className="mb-4 text-muted-foreground">
                  For EU residents, you can contact our Data Protection Officer at: dpo@docksphere.com
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            Last updated: December 11, 2024 • Version 1.0 • Effective: December 11, 2024
          </p>
        </div>

        {/* Back to Top Button */}
        <BackToTop />
      </div>
    </div>
  );
}