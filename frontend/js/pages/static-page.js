// ============================================================
// SHARED STATIC/EDITORIAL PAGE BOOTSTRAP
// About, Help, Privacy/Terms-style pages do not need custom data logic; they only
// need the shared navbar/footer and optional knowledge of the current user.
// ============================================================

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getCurrentUser } from "../services/auth-service.js";

// Static pages remain public, so a missing/failed session is treated as a guest.
const user = await getCurrentUser().catch(() => null);
await renderNavbar("..", user);
renderFooter();
