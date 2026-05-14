"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuthenticatedFetch } from "@/lib/api";

type WorkflowFormState = {
  name: string;
  recipient: string;
  message: string;
  sendDelayMinutes: string;
};

const initialFormState: WorkflowFormState = {
  name: "Welcome message",
  recipient: "+1 555 012 3400",
  message: "Hi {{first_name}}, thanks for signing up. Reply YES to get started.",
  sendDelayMinutes: "0",
};

export default function NewWorkflowPage() {
  const [form, setForm] = useState<WorkflowFormState>(initialFormState);
  const [savedDraft, setSavedDraft] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const authenticatedFetch = useAuthenticatedFetch();

  const messageLength = form.message.trim().length;
  const delayMinutes = Number.parseInt(form.sendDelayMinutes || "0", 10) || 0;

  const previewPayload = useMemo(
    () => ({
      workflow: form.name.trim() || "Untitled workflow",
      recipient: form.recipient.trim() || "Add a phone number",
      delayMinutes,
      message: form.message.trim() || "Your message will appear here.",
    }),
    [delayMinutes, form.message, form.name, form.recipient]
  );

  function updateField<K extends keyof WorkflowFormState>(field: K, value: WorkflowFormState[K]) {
    setSavedDraft(false);
    setSaveState("idle");
    setStatusMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveWorkflow(sendNow: boolean) {
    setSaveState("saving");
    setStatusMessage("");

    try {
      const response = await authenticatedFetch("/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          recipient: form.recipient,
          message: form.message,
          sendDelayMinutes: Number.parseInt(form.sendDelayMinutes || "0", 10) || 0,
          sendNow,
        }),
      });

      const data = (await response.json()) as {
        workflow?: { id?: string; status?: string };
        delivery?: { status?: string; provider?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to save workflow");
      }

      setSavedDraft(true);
      setSaveState("saved");
      setStatusMessage(
        sendNow
          ? `Workflow sent via ${data.delivery?.provider || "provider"}.`
          : `Draft saved on the server with status ${data.workflow?.status || "draft"}.`
      );
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "Unexpected save error");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveWorkflow(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
              Workflow builder
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Create your first WhatsApp automation
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20"
          >
            <div className="grid gap-5">
              <div>
                <label className="text-sm font-medium text-slate-200" htmlFor="name">
                  Workflow name
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                  placeholder="Welcome message"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-200" htmlFor="recipient">
                    Recipient number
                  </label>
                  <input
                    id="recipient"
                    value={form.recipient}
                    onChange={(event) => updateField("recipient", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                    placeholder="+1 555 012 3400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200" htmlFor="delay">
                    Send delay
                  </label>
                  <input
                    id="delay"
                    type="number"
                    min="0"
                    value={form.sendDelayMinutes}
                    onChange={(event) => updateField("sendDelayMinutes", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-200" htmlFor="message">
                    WhatsApp message
                  </label>
                  <span className="text-xs text-slate-400">{messageLength} characters</span>
                </div>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="mt-2 min-h-44 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                  placeholder="Write the message you want to send"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => void saveWorkflow(true)}
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Send now
                </button>
                <span className="text-sm text-slate-300">
                  {saveState === "saving"
                    ? "Saving to the backend..."
                    : statusMessage || (savedDraft ? "Draft saved on the backend." : "Draft changes are unsaved.")}
                </span>
              </div>
            </div>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preview</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {previewPayload.workflow}
            </h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Recipient
                </p>
                <p className="mt-2 text-sm font-medium text-slate-100">
                  {previewPayload.recipient}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Delay
                </p>
                <p className="mt-2 text-sm font-medium text-slate-100">
                  {previewPayload.delayMinutes === 0
                    ? "Send immediately after approval"
                    : `Send after ${previewPayload.delayMinutes} minute${previewPayload.delayMinutes === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
                  Message preview
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-50">
                  {previewPayload.message}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              This is the first real workflow screen. The next backend step is to
              add an API route that stores the draft and later dispatches the
              message through your WhatsApp provider.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}