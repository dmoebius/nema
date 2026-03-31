import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.dmoebius.nema",
  appName: "nema",
  webDir: "dist",
  plugins: {
    Contacts: {
      // Request read/write access to device contacts
    },
  },
};

export default config;
