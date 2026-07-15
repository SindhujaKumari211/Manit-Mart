import React, { useEffect } from "react";

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-border prose prose-secondary max-w-none">
          <div className="text-center mb-10 pb-8 border-b border-border">
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight mb-3">Terms &amp; Conditions</h1>
            <p className="text-muted font-medium">Know Your Brand</p>
            <p className="text-xs text-muted mt-2">Last updated: July 2026</p>
          </div>

          <div className="space-y-8 text-text-secondary leading-relaxed">
            <p>
              Welcome to Know Your Brand. By accessing or using this platform, you agree to the following Terms &amp; Conditions. Please read them carefully before buying, selling, or listing any product.
            </p>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">1. Nature of the Platform</h2>
              <p>
                Know Your Brand is a non-profit, student-run platform built to help BHU students buy and sell products within their own campus community. We are only an intermediary that connects buyers and sellers — we are not a party to any transaction that takes place between users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">2. No Ownership or Verification of Products</h2>
              <p>
                Know Your Brand does not own, inspect, verify, or guarantee any product listed on the platform. All listings are created and managed entirely by users. We do not check the condition, authenticity, quality, pricing, legality, or accuracy of any item listed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">3. User Responsibility</h2>
              <p className="mb-2">By using this platform, you agree that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You are solely responsible for verifying the condition, authenticity, quality, pricing, and legality of any product before buying or selling it.</li>
                <li>You are responsible for the accuracy of the information, photos, and pricing you provide in your own listings.</li>
                <li>You will exercise your own judgment when communicating with, meeting, and transacting with other users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">4. No Liability</h2>
              <p className="mb-2">Know Your Brand, its creators, and team members shall not be held responsible or liable for:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>Any disputes between buyers and sellers</li>
                <li>Fraud, misrepresentation, or scams by any user</li>
                <li>Damages, losses, or defects related to any product</li>
                <li>Payment-related issues, including failed, delayed, or disputed payments</li>
                <li>Delivery, pickup, or exchange issues</li>
                <li>Any direct, indirect, incidental, or consequential loss arising from the use of this platform</li>
              </ul>
              <p className="font-semibold text-text-primary">
                All transactions are conducted directly between users, at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">5. Safety Guidelines</h2>
              <p className="mb-2">For your safety, we strongly recommend that users:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Meet only in safe, public places on or around campus when exchanging products</li>
                <li>Avoid sharing sensitive personal or financial information</li>
                <li>Inspect products in person before making payment</li>
                <li>Trust their own judgment — if something feels off, walk away</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">6. Communication on the Platform</h2>
              <p>
                Know Your Brand provides an in-app chat feature so users can communicate without sharing their phone number. Sharing personal contact details is entirely optional. We are not responsible for any interactions that take place outside the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">7. No Fees, No Guarantees</h2>
              <p>
                Know Your Brand does not charge any listing fees, commissions, or hidden charges. As a free, non-profit service, we make no warranties or guarantees — express or implied — regarding the platform's availability, accuracy, or performance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">8. Account Responsibility</h2>
              <p>
                Users are responsible for maintaining the confidentiality of their account credentials and for all activity that occurs under their account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">9. Right to Remove Content</h2>
              <p>
                We reserve the right to remove any listing, content, or account that violates these terms, appears fraudulent, or is otherwise inappropriate for the platform — without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">10. Changes to These Terms</h2>
              <p>
                These Terms &amp; Conditions may be updated from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-3">11. Agreement</h2>
              <p>
                By registering, listing a product, or using Know Your Brand in any way, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions, and that Know Your Brand acts only as an intermediary marketplace and bears no liability for any transaction conducted through it.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-brand-700 font-medium">
                Know Your Brand is a non-profit initiative built by BHU students, for BHU students.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
