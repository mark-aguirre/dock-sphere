import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LogoImage } from '@/components/ui/logo-image';

export default function TermsPage() {
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
              <LogoImage size="sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Legal terms and conditions for using DockSphere</p>
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
            <a href="#service-description" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              1. Service Description
            </a>
            <a href="#user-obligations" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              2. User Obligations
            </a>
            <a href="#liability-limitations" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              3. Liability Limitations
            </a>
            <a href="#privacy-policy" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              4. Privacy Policy and Data Handling
            </a>
            <a href="#contact-information" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              5. Contact Information
            </a>
            <a href="#governing-law" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              6. Governing Law and Jurisdiction
            </a>
            <a href="#service-availability" className="block text-sm text-primary hover:text-primary/80 transition-colors py-1">
              7. Service Availability and Modifications
            </a>
          </nav>
        </div>

        <Separator className="mb-8" />

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Service Description */}
          <section id="service-description" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">1.</span>
              Service Description
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">1.1 About DockSphere</h3>
                <p className="mb-4 text-muted-foreground">
                  DockSphere is a modern Docker container management platform that provides real-time monitoring, 
                  intelligent orchestration, and comprehensive container lifecycle management. Our service enables 
                  users to efficiently manage Docker containers, images, networks, and volumes through an intuitive web interface.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">1.2 Service Features</h3>
                <p className="mb-4 text-muted-foreground">The DockSphere platform includes:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Real-time container monitoring and resource usage tracking</li>
                  <li>Container lifecycle management (start, stop, restart, remove)</li>
                  <li>Image management and registry integration</li>
                  <li>Network configuration and management</li>
                  <li>Volume management and data persistence</li>
                  <li>Build automation and CI/CD integration</li>
                  <li>Security scanning and compliance monitoring</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Obligations */}
          <section id="user-obligations" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">2.</span>
              User Obligations
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">2.1 Account Responsibility</h3>
                <p className="mb-4 text-muted-foreground">Users are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Maintaining the security of their account credentials</li>
                  <li>All activities that occur under their account</li>
                  <li>Ensuring compliance with applicable laws and regulations</li>
                  <li>Proper use of system resources and avoiding abuse</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">2.2 Acceptable Use</h3>
                <p className="mb-4 text-muted-foreground">Users must not:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Use the service for illegal activities or malicious purposes</li>
                  <li>Attempt to gain unauthorized access to other users' containers or data</li>
                  <li>Overload system resources or interfere with service availability</li>
                  <li>Violate intellectual property rights or distribute unauthorized content</li>
                  <li>Use the service to mine cryptocurrency without explicit permission</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Liability Limitations */}
          <section id="liability-limitations" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">3.</span>
              Liability Limitations
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">3.1 Service Availability</h3>
                <p className="mb-4 text-muted-foreground">DockSphere provides the service on an "as-is" basis. We do not guarantee:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Uninterrupted service availability or uptime</li>
                  <li>Data integrity or protection against loss</li>
                  <li>Compatibility with all Docker images or configurations</li>
                  <li>Performance levels for specific use cases</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">3.2 Limitation of Liability</h3>
                <p className="mb-4 text-muted-foreground">To the maximum extent permitted by law, DockSphere shall not be liable for:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages resulting from service interruptions or data loss</li>
                  <li>Third-party actions or content within user containers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy-policy" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">4.</span>
              Privacy Policy and Data Handling
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">4.1 Data Collection</h3>
                <p className="mb-4 text-muted-foreground">We collect and process:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Account information and authentication data</li>
                  <li>Container metadata and configuration information</li>
                  <li>Usage statistics and performance metrics</li>
                  <li>Log data for troubleshooting and security purposes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">4.2 Data Protection</h3>
                <p className="mb-4 text-muted-foreground">We implement appropriate security measures to protect user data, including:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Compliance with applicable data protection regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section id="contact-information" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">5.</span>
              Contact Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">5.1 Legal Inquiries</h3>
                <p className="mb-4 text-muted-foreground">For legal questions or concerns regarding these terms:</p>
                <div className="p-4 bg-card border border-border rounded-lg text-muted-foreground">
                  <p><strong>Email:</strong> legal@docksphere.com</p>
                  <p><strong>Address:</strong> DockSphere Legal Department</p>
                  <p>123 Container Street</p>
                  <p>Docker City, DC 12345</p>
                  <p>United States</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">5.2 Support Contact</h3>
                <p className="mb-4 text-muted-foreground">For technical support and general inquiries:</p>
                <div className="p-4 bg-card border border-border rounded-lg text-muted-foreground">
                  <p><strong>Email:</strong> support@docksphere.com</p>
                  <p><strong>Documentation:</strong> <a href="https://docs.docksphere.com" className="text-primary hover:underline">https://docs.docksphere.com</a></p>
                  <p><strong>Community:</strong> <a href="https://community.docksphere.com" className="text-primary hover:underline">https://community.docksphere.com</a></p>
                </div>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">6.</span>
              Governing Law and Jurisdiction
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">6.1 Applicable Law</h3>
                <p className="mb-4 text-muted-foreground">
                  These Terms of Service are governed by the laws of the State of Delaware, United States, 
                  without regard to conflict of law principles.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">6.2 Dispute Resolution</h3>
                <p className="mb-4 text-muted-foreground">Any disputes arising from these terms shall be resolved through:</p>
                <ol className="list-decimal list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Good faith negotiation between the parties</li>
                  <li>Binding arbitration under the rules of the American Arbitration Association</li>
                  <li>Jurisdiction in the state and federal courts of Delaware</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section id="service-availability" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">7.</span>
              Service Availability and Modifications
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">7.1 Service Availability</h3>
                <p className="mb-4 text-muted-foreground">DockSphere reserves the right to:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Modify, suspend, or discontinue the service with reasonable notice</li>
                  <li>Implement maintenance windows and service updates</li>
                  <li>Adjust service features and capabilities based on technical requirements</li>
                  <li>Terminate accounts that violate these terms</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">7.2 Terms Modifications</h3>
                <p className="mb-4 text-muted-foreground">We may update these Terms of Service from time to time. Users will be notified of material changes through:</p>
                <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                  <li>Email notifications to registered users</li>
                  <li>Prominent notices within the DockSphere interface</li>
                  <li>Updates to this terms page with revised effective dates</li>
                </ul>
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
      </div>
    </div>
  );
}