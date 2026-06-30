import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";

const packages = [
  "Tier 1 - Community Supporter",
  "Tier 2 - Business Radio",
  "Tier 3 - Community Partner",
  "Tier 4 - Premier Local Partner",
  "Tier 5 - Signature Underwriter",
  "Not sure yet",
];

const recognitionDetails = [
  "Business name",
  "Location",
  "Website",
  "Phone",
  "Hours",
  "Products or services",
  "Value-neutral descriptions",
];

const copyBoundaries = [
  "Calls to action",
  "Discount language",
  "Comparative claims",
  "Promotional pricing",
];

function Field({
  id,
  label,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-zinc-200">{label}</span>
      <input
        id={id}
        name={label}
        type={type}
        required={required}
        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none ring-orange-400/40 focus:border-orange-400 focus:ring-4"
      />
    </label>
  );
}

function TextArea({
  id,
  label,
  rows = 4,
}: {
  id: string;
  label: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-zinc-200">{label}</span>
      <textarea
        id={id}
        name={label}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none ring-orange-400/40 focus:border-orange-400 focus:ring-4"
      />
    </label>
  );
}

export default function UnderwritingApplyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <nav className="mx-auto mb-12 flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LiveBroadcastButton />
          <Link href="/underwriting" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwriting
          </Link>
          <Link href="/underwriters" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwriters
          </Link>
          <Link href="/" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300">
            Home
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
          Underwriter Application
        </p>
        <h1 className="mt-5 text-5xl font-black md:text-7xl">
          Tell us about your business.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
          This form opens an email to Murphys Community Radio. We will connect
          payment links, invoices, CRM automation, and notifications after the
          underwriting workflow is finalized.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-400">
          Recognition Copy Notes
        </p>
        <h2 className="mt-4 text-3xl font-black">
          We will keep acknowledgements factual and community-minded.
        </h2>
        <p className="mt-4 leading-7 text-zinc-300">
          During setup, we will shape your underwriting language around clear
          business information and avoid promotional phrasing that feels like a
          hard-sell ad.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-black text-orange-300">
              Good details to include
            </h3>
            <ul className="mt-4 grid gap-3 text-sm text-zinc-300">
              {recognitionDetails.map((item) => (
                <li key={item} className="rounded-2xl bg-black px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-black text-orange-300">
              We will steer away from
            </h3>
            <ul className="mt-4 grid gap-3 text-sm text-zinc-300">
              {copyBoundaries.map((item) => (
                <li key={item} className="rounded-2xl bg-black px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <form
        action="mailto:joe@murphyscommunityradio.com?subject=Underwriter%20Application"
        method="post"
        encType="text/plain"
        className="mx-auto mt-14 max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10"
      >
        {/* TODO: Connect this form to Stripe payment links, Found invoice links, CRM automation, and email notifications. */}
        <div className="grid gap-6 md:grid-cols-2">
          <Field id="business-name" label="Business name" required />
          <Field id="contact-name" label="Contact name" required />
          <Field id="email" label="Email" type="email" required />
          <Field id="phone" label="Phone" type="tel" />
          <Field id="website" label="Website" type="url" />
          <Field id="business-address" label="Business address" />
          <Field id="social-links" label="Social links" />
          <label className="block">
            <span className="text-sm font-bold text-zinc-200">
              Desired package/tier
            </span>
            <select
              name="Desired package/tier"
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none ring-orange-400/40 focus:border-orange-400 focus:ring-4"
              defaultValue=""
            >
              <option value="" disabled>
                Select a package
              </option>
              {packages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <Field id="preferred-start-date" label="Preferred start date" type="date" />
          <Field id="billing-email" label="Billing email" type="email" />
        </div>

        <div className="mt-8 grid gap-6">
          <TextArea id="business-description" label="Business description" />
          <TextArea id="products-services" label="Products/services to mention" />
          <TextArea id="phrases-to-avoid" label="Words or phrases to avoid" rows={3} />
          <TextArea id="pronunciation-notes" label="Pronunciation notes" rows={3} />
          <TextArea id="asset-notes" label="Upload/logo instructions or asset notes" />
          <TextArea
            id="tier-2-notes"
            label="For Tier 2: music style, do-not-play list, screen display content notes"
          />
          <TextArea
            id="tier-5-notes"
            label="For Tier 5: event support, Live365 player, live radio, and add-on notes"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-8">
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Submitting will open your email app addressed to
            joe@murphyscommunityradio.com. Attach logos or brand assets there
            if needed.
          </p>
          <button
            type="submit"
            className="rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300"
          >
            Send Application
          </button>
        </div>
      </form>
    </main>
  );
}
