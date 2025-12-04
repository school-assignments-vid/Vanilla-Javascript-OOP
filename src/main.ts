import "./styles/main.scss";
import { SystemCore } from "./core/SystemCore";

document.addEventListener("DOMContentLoaded", () => {
  const system = SystemCore.getInstance();
  system.boot().catch((err) => {
    console.error("System failed to boot:", err);
  });
});