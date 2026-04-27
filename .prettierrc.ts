import { type Config } from "prettier";

const config: Config = {
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
      options: {
        printWidth: 120,
      },
    },
  ],
};

export default config;
