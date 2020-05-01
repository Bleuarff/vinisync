import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import multi from "@rollup/plugin-multi-entry";
import svelte from "rollup-plugin-svelte";

export default {
  input: "test/**/*.js",
  output: {
    sourcemap: true,
    format: "cjs",
    name: "tests",
    file: "build/bundle-tests.js"
  },
  plugins: [
    multi(),
    svelte({ css: false, dev: true }),
    resolve({
      resolveOnly: [/^svelte-/]
    }),
    commonjs()
  ],
  onwarn (warning, warn) {
    if (warning.code === "UNRESOLVED_IMPORT") return;
    warn(warning);
  }
};
