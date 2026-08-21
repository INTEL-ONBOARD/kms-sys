"use client";

import { useState, useEffect } from "react";
import DashHeader from "@/Components/DashHeader";
import AdminSidebar from "@/Components/AdminSidebar";
import {
  FiSave, FiGlobe, FiCreditCard,
  FiMessageSquare, FiAward, FiVideo, FiCheckCircle, FiAlertCircle,
  FiMail, FiClock, FiAlertTriangle,
} from "react-icons/fi";

interface FeatureFlags {
  discussionForums: boolean;
  gamification: boolean;
  liveSessions: boolean;
  certificates: boolean;
  maintenanceMode: boolean;
}

interface SettingsState {
  platformName: string;
  primaryDomain: string;
  supportEmail: string;
  timezone: string;
  defaultCurrency: string;
  activePaymentGateway: string;
  features: FeatureFlags;
}

const ToggleSwitch = ({
  enabled,
  onToggle,
  danger = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={enabled}
    className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-1 ${
      enabled
        ? danger
          ? "bg-red-500 justify-end"
          : "bg-indigo-600 justify-end"
        : "bg-gray-300 justify-start"
    }`}
  >
    <div className="w-4 h-4 bg-white rounded-full shadow-md" />
  </button>
);

const DEFAULT_SETTINGS: SettingsState = {
  platformName: "",
  primaryDomain: "",
  supportEmail: "",
  timezone: "UTC",
  defaultCurrency: "USD",
  activePaymentGateway: "stripe",
  features: {
    discussionForums: true,
    gamification: true,
    liveSessions: true,
    certificates: true,
    maintenanceMode: false,
  },
};

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const s = data.settings;
        setSettings({
          platformName:         s.platformName         ?? DEFAULT_SETTINGS.platformName,
          primaryDomain:        s.primaryDomain        ?? DEFAULT_SETTINGS.primaryDomain,
          supportEmail:         s.supportEmail         ?? DEFAULT_SETTINGS.supportEmail,
          timezone:             s.timezone             ?? DEFAULT_SETTINGS.timezone,
          defaultCurrency:      s.defaultCurrency      ?? DEFAULT_SETTINGS.defaultCurrency,
          activePaymentGateway: s.activePaymentGateway ?? DEFAULT_SETTINGS.activePaymentGateway,
          features: {
            discussionForums: s.features?.discussionForums ?? true,
            gamification:     s.features?.gamification     ?? true,
            liveSessions:     s.features?.liveSessions     ?? true,
            certificates:     s.features?.certificates     ?? true,
            maintenanceMode:  s.features?.maintenanceMode  ?? false,
          },
        });
      } catch (err) {
        console.error(err);
        showToast("error", "Could not load settings from the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) =>
    setToast({ type, message });

  const handleChange = (field: keyof Omit<SettingsState, "features">, value: string) =>
    setSettings(prev => ({ ...prev, [field]: value }));

  const handleToggle = (feature: keyof FeatureFlags) =>
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      showToast("success", "Settings saved successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6 relative">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-bold ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}>
              {toast.type === "success"
                ? <FiCheckCircle className="text-lg flex-shrink-0" />
                : <FiAlertCircle className="text-lg flex-shrink-0" />}
              {toast.message}
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Platform Settings</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Configure system preferences, features, and integrations</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="mt-4 md:mt-0 bg-[#5A67D8] hover:bg-[#434190] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300"
            >
              <FiSave className="mr-2 text-lg" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm font-medium">
              Loading settings...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">

                {/* General Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                    <FiGlobe className="text-indigo-600 text-xl mr-3" />
                    <h2 className="text-lg font-bold text-gray-800">General Configuration</h2>
                  </div>
                  <div className="p-6 space-y-5">

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Platform Name</label>
                      <input
                        type="text"
                        value={settings.platformName}
                        onChange={e => handleChange("platformName", e.target.value)}
                        placeholder="e.g. Wise East University"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Primary Domain</label>
                      <input
                        type="text"
                        value={settings.primaryDomain}
                        onChange={e => handleChange("primaryDomain", e.target.value)}
                        placeholder="e.g. lms.wiseeast.edu"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="flex items-center gap-1.5"><FiMail className="text-indigo-500" /> Support Email</span>
                      </label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={e => handleChange("supportEmail", e.target.value)}
                        placeholder="e.g. support@wiseeast.edu"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">Displayed on student-facing error and contact pages.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="flex items-center gap-1.5"><FiClock className="text-indigo-500" /> System Timezone</span>
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={e => handleChange("timezone", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Colombo">Asia/Colombo (IST +5:30)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="America/New_York">America/New_York (EST -5:00)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
                        <option value="Europe/London">Europe/London (GMT +0:00)</option>
                        <option value="Europe/Paris">Europe/Paris (CET +1:00)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                        <option value="Australia/Sydney">Australia/Sydney (AEDT +11:00)</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Used for scheduling, deadlines, and all date/time displays.</p>
                    </div>

                  </div>
                </div>

                {/* Payments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                    <FiCreditCard className="text-green-600 text-xl mr-3" />
                    <h2 className="text-lg font-bold text-gray-800">Payments and Currency</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Default Currency</label>
                      <select
                        value={settings.defaultCurrency}
                        onChange={e => handleChange("defaultCurrency", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (euro)</option>
                        <option value="LKR">LKR (Rs)</option>
                        <option value="GBP">GBP (pound)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Active Payment Gateway</label>
                      <select
                        value={settings.activePaymentGateway}
                        onChange={e => handleChange("activePaymentGateway", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="stripe">Stripe Connect</option>
                        <option value="paypal">PayPal</option>
                        <option value="razorpay">Razorpay</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Feature Toggles */}
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center bg-gray-50">
                    <FiAward className="text-orange-600 text-xl mr-3" />
                    <h2 className="text-lg font-bold text-gray-800">Feature Management</h2>
                  </div>
                  <div className="p-6 space-y-6">

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
                          <FiMessageSquare className="text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Discussion Forums</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Allow course Q and A forums</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={settings.features.discussionForums} onToggle={() => handleToggle("discussionForums")} />
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                          <FiAward className="text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Gamification</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Points, badges and leaderboards</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={settings.features.gamification} onToggle={() => handleToggle("gamification")} />
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                          <FiVideo className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Live Sessions</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Zoom/Meet WebRTC integration</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={settings.features.liveSessions} onToggle={() => handleToggle("liveSessions")} />
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                          <FiAward className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">Certificates</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Auto-issue PDF certificates</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={settings.features.certificates} onToggle={() => handleToggle("certificates")} />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Maintenance Mode - danger zone style */}
                    <div className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      settings.features.maintenanceMode ? "bg-red-50 border border-red-200" : ""
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          settings.features.maintenanceMode ? "bg-red-100" : "bg-gray-50"
                        }`}>
                          <FiAlertTriangle className={settings.features.maintenanceMode ? "text-red-600" : "text-gray-400"} />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${settings.features.maintenanceMode ? "text-red-700" : "text-gray-800"}`}>
                            Maintenance Mode
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Temporarily disable student access</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.features.maintenanceMode}
                        onToggle={() => handleToggle("maintenanceMode")}
                        danger={true}
                      />
                    </div>

                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}