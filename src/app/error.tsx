"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="kicker">Error</p>
      <h1 className="mt-3 font-serif text-4xl">This page failed to load.</h1>
      <p className="mt-3 text-sm text-muted">The sample database did not answer. Retry, or restart the app after seeding.</p>
      <button type="button" className="btn mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
