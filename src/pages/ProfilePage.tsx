import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { initialsOf } from "@/lib/format";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { useToastContext } from "@/components/feedback/toast";

const SETTINGS_ITEMS: { icon: string; title: string; subtitle: string; to?: string }[] = [
  { icon: "person", title: "Personal Information", subtitle: "Update your details" },
  { icon: "confirmation_number", title: "My Bookings", subtitle: "Past and upcoming trips", to: "/my-bookings" },
  { icon: "payments", title: "Payment Methods", subtitle: "Manage cards and wallets" },
  { icon: "notifications", title: "Notifications", subtitle: "Alert preferences" },
  { icon: "help", title: "Help/Support", subtitle: "FAQs and contact" },
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [showLogout, setShowLogout] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleAvatar = (file: File | undefined) => {
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      setAvatarFailed(false);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error("Couldn't load that image", "Please try a different file.");
    }
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogout(false);
      toast.info("Signed out", "See you next trip!");
      navigate("/login");
    } catch (err) {
      setShowLogout(false);
      toast.error("Couldn't sign out", "Please try again.");
    }
  };

  const showAvatar = avatarUrl && !avatarFailed;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-stack-lg">
        {/* Profile header */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-stack-md text-center md:text-left">
          <div className="relative group">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container hover:opacity-90 transition-opacity"
              aria-label="Change profile picture"
            >
              {showAvatar ? (
                <img
                  src={avatarUrl}
                  alt={`${user.name}'s profile picture`}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-primary-container text-on-primary-fixed flex items-center justify-center font-headline-lg text-headline-lg font-black">
                  {initialsOf(user.name) || "U"}
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => handleAvatar(e.target.files?.[0])}
            />
            <span className="absolute bottom-0 right-0 bg-surface-container-lowest border border-outline-variant p-2 rounded-full">
              <span className="material-symbols-outlined text-on-surface text-[20px]" aria-hidden="true">
                edit
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-unit mt-2 md:mt-4">
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary">
              {user.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-sm border border-[#1A1A1A]">
                <span className="material-symbols-outlined text-primary-container text-[16px] fill-icon" aria-hidden="true">
                  star
                </span>
                <span className="text-label-bold font-label-bold text-primary-container">Gold Member</span>
              </span>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                {user.email}
              </span>
            </div>
          </div>
        </section>

        {/* Settings list */}
        <section className="flex flex-col gap-2">
          {SETTINGS_ITEMS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                if (item.to) navigate(item.to);
                else toast.info("Coming soon", `${item.title} isn't available yet.`);
              }}
              className="group flex items-center justify-between bg-[#1A1A1A] p-4 rounded-sm border border-transparent hover:border-primary-container transition-colors duration-200 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-lowest flex items-center justify-center rounded-sm text-on-surface group-hover:text-primary-container transition-colors">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-body-md font-body-md text-primary font-bold">{item.title}</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">{item.subtitle}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors" aria-hidden="true">
                chevron_right
              </span>
            </button>
          ))}
        </section>

        {/* Logout */}
        <div className="mt-auto pt-stack-md">
          <Button variant="secondary" block onClick={() => setShowLogout(true)}>
            <span className="material-symbols-outlined" aria-hidden="true">
              logout
            </span>
            Logout
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Sign out?"
        message="You'll need to sign in again to manage your bookings."
        confirmLabel="Sign out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogout(false)}
        danger
      />
    </AppShell>
  );
}
