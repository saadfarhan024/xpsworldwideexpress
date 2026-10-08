import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { pageWrap } from "@/components/site/styles";

export const metadata: Metadata = {
  title: "Privacy Policy | Go Delivery Express",
  description:
    "Learn how Go Delivery Express Fulfillment Service collects, uses, and shares personal information.",
};

const sectionHeading = "mb-3 mt-9 text-[21px] font-semibold leading-snug text-[#222328] first:mt-0";
const paragraph = "mb-4 text-[15px] leading-[1.85] text-[#5b5c62]";
const list = "mb-5 list-disc space-y-2 pl-6 text-[15px] leading-[1.8] text-[#5b5c62] marker:text-[#163e6a]";
const linkClass = "text-[#ec8123] underline decoration-[#ec8123]/30 underline-offset-4 hover:decoration-[#ec8123]";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <section className="relative grid min-h-75 place-items-center overflow-hidden bg-[linear-gradient(120deg,#302d2d,#080809_68%)] px-5 pb-6 pt-30 text-center text-white max-[760px]:min-h-56 max-[760px]:pt-22">
        <div className="pointer-events-none absolute -left-20 top-4 size-64 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -right-16 top-0 size-72 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">Go Delivery Express</p>
          <h1 className="m-0 text-[clamp(38px,5vw,60px)] font-medium leading-tight">Privacy Policy</h1>
        </div>
      </section>

      <article className={`${pageWrap} max-w-210 py-18 max-[760px]:py-12`}>
        <p className="mb-8 border-l-3 border-[#163e6a] pl-4 text-[16px] font-medium leading-[1.8] text-[#34353a]">
          Go Delivery Express Service Privacy Policy
        </p>

        <p className={paragraph}>
          Go Delivery Express Fulfillment Service (“the App”) provides comprehensive fulfillment and shipping services (“the Service”) to merchants who use Shopify to power their stores. This Privacy Policy describes how personal information is collected, used, and shared when you install or use the App in connection with your Shopify-supported store.
        </p>

        <h2 className={sectionHeading}>Personal Information the App Collects</h2>
        <p className={paragraph}>
          When you install the App, we are automatically able to access certain types of information from your Shopify account:
        </p>
        <ul className={list}>
          <li><strong className="font-semibold text-[#34353a]">Shopify API Access:</strong> Includes access to store details, orders, and customer information necessary for fulfillment purposes.</li>
        </ul>
        <p className={paragraph}>
          Additionally, we collect the following types of personal information from you and/or your customers once you have installed the App:
        </p>
        <ul className={list}>
          <li><strong className="font-semibold text-[#34353a]">Merchant Information:</strong> Information about you and others who may access the App on behalf of your store, such as your name, address, email address, phone number, and billing information.</li>
          <li><strong className="font-semibold text-[#34353a]">Customer Information:</strong> Information about individuals who visit your store, such as their IP address, web browser details, time zone, and information about the cookies installed on their devices.</li>
        </ul>
        <p className={paragraph}>
          We collect personal information directly from the relevant individual, through your Shopify account, or using the following technologies:
        </p>
        <ul className={list}>
          <li><strong className="font-semibold text-[#34353a]">Cookies:</strong> Data files placed on your device or computer, including an anonymous unique identifier. For more information about cookies and how to disable them, visit <a className={linkClass} href="https://www.allaboutcookies.org/" target="_blank" rel="noreferrer">allaboutcookies.org</a>.</li>
          <li><strong className="font-semibold text-[#34353a]">Log Files:</strong> Track actions occurring on the Site, including IP address, browser type, Internet service provider, referring/exit pages, and date/time stamps.</li>
          <li><strong className="font-semibold text-[#34353a]">Web Beacons, Tags, and Pixels:</strong> Electronic files used to record information about how you browse the Site.</li>
        </ul>

        <h2 className={sectionHeading}>How Do We Use Your Personal Information?</h2>
        <p className={paragraph}>
          We use the personal information we collect from you and your customers to provide the Service and to operate the App. Additionally, we use this personal information to:
        </p>
        <ul className={list}>
          <li>Communicate with you.</li>
          <li>Optimize or improve the App.</li>
          <li>Provide you with information or advertising relating to our products or services.</li>
        </ul>

        <h2 className={sectionHeading}>Sharing Your Personal Information</h2>
        <p className={paragraph}>
          We may share personal information with third parties who assist us in operating the App or providing the Service, such as:
        </p>
        <ul className={list}>
          <li>Fulfillment and shipping partners.</li>
          <li>Payment processors.</li>
          <li>Customer support services.</li>
        </ul>
        <p className={paragraph}>
          Finally, we may also share your Personal Information to comply with applicable laws and regulations, respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
        </p>

        <h2 className={sectionHeading}>Behavioural Advertising</h2>
        <p className={paragraph}>
          As described above, we use your Personal Information to provide you with targeted advertisements or marketing communications we believe may be of interest to you. For more information about how targeted advertising works, visit the Network Advertising Initiative’s <a className={linkClass} href="https://thenai.org/about-online-advertising/how-does-it-work/" target="_blank" rel="noreferrer">educational page</a>.
        </p>
        <p className={paragraph}>You can opt out of targeted advertising by:</p>
        <ul className={list}>
          <li>Facebook: Facebook Ad Preferences</li>
          <li>Google: Google Ads Settings</li>
          <li>Bing: Bing Ads Settings</li>
        </ul>
        <p className={paragraph}>
          Additionally, you can opt out of some of these services by visiting the Digital Advertising Alliance’s opt-out portal at: <a className={linkClass} href="https://optout.aboutads.info/" target="_blank" rel="noreferrer">optout.aboutads.info</a>.
        </p>

        <h2 className={sectionHeading}>Your Rights</h2>
        <p className={paragraph}>
          If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.
        </p>
        <p className={paragraph}>
          Additionally, if you are a European resident, we process your information to fulfill contracts we might have with you or to pursue our legitimate business interests. Please note that your information will be transferred outside of Europe, including to Canada and the United States.
        </p>

        <h2 className={sectionHeading}>Data Retention</h2>
        <p className={paragraph}>
          When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
        </p>

        <h2 className={sectionHeading}>Changes</h2>
        <p className={paragraph}>
          We may update this privacy policy from time to time to reflect changes to our practices or for other operational, legal, or regulatory reasons.
        </p>

        <h2 className={sectionHeading}>Contact Us</h2>
        <p className={paragraph}>
          For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at <a className={linkClass} href="mailto:info@godeliveryexpress.pk">info@godeliveryexpress.pk</a> or by mail using the details provided below:
        </p>
        <address className="not-italic text-[15px] leading-[1.8] text-[#5b5c62]">
          Shop-40 Liaqat Market<br />
          Near New Memon Masjid<br />
          Bolton Market<br />
          M.A Jinaah Road<br />
          Karachi, Pakistan<br />
          Phone Number: <a className={linkClass} href="tel:+923363587468">+92 336 3587468</a> / <a className={linkClass} href="tel:+922132410335">+92 21 32410335</a>
        </address>
      </article>
      <SiteFooter />
    </main>
  );
}
