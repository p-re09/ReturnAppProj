import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send, ShieldAlert } from "lucide-react";

export default function ReturnRequestForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    orderId: "",
    productId: "",
    pickupAddress: "",
    returnReason: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const apiUrl = useMemo(() => {
    return import.meta.env.VITE_RETURNS_API_URL || "/api/returns";
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.orderId.trim()) return "Order ID is required.";
    if (!form.productId.trim()) return "Product ID is required.";
    if (!form.pickupAddress.trim()) return "Pickup address is required.";
    if (!form.returnReason.trim()) return "Return reason is required.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        orderId: form.orderId.trim(),
        productId: form.productId.trim(),
        pickupAddress: form.pickupAddress.trim(),
        returnReason: form.returnReason.trim(),
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch("http://localhost:3001/submit-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      setSuccess(true);
      setMessage("Your return request has been submitted successfully.");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        orderId: "",
        productId: "",
        pickupAddress: "",
        returnReason: "",
      });
    } catch (err) {
      setError(err?.message || "Something went wrong while submitting the form.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
  const labelClass = "text-sm font-medium text-slate-700";
  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
            <ShieldAlert className="h-4 w-4" />
            Return Request Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Submit a return request
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Fill in your details below
          </p>
        </motion.div>

        <div className={cardClass}>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="firstName">
                First name
              </label>
              <input
                className={inputClass}
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Precious"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="lastName">
                Last name
              </label>
              <input
                className={inputClass}
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Ikechukwu"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                className={inputClass}
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="phoneNumber">
                Phone number
              </label>
              <input
                className={inputClass}
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="+44..."
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="orderId">
                Order ID
              </label>
              <input
                className={inputClass}
                id="orderId"
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                placeholder="ORD930122"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="productId">
                Product ID
              </label>
              <input
                className={inputClass}
                id="productId"
                name="productId"
                value={form.productId}
                onChange={handleChange}
                placeholder="PROD002"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className={labelClass} htmlFor="pickupAddress">
                Pickup address
              </label>
              <textarea
                className={inputClass}
                id="pickupAddress"
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="221B Baker Street, London"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className={labelClass} htmlFor="returnReason">
                Return reason
              </label>
              <textarea
                className={inputClass}
                id="returnReason"
                name="returnReason"
                value={form.returnReason}
                onChange={handleChange}
                placeholder="The item arrived damaged..."
                rows={4}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-3 pt-2">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  API endpoint:{" "}
                  <span className="font-medium text-slate-700">{apiUrl}</span>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit return request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}