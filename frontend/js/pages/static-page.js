import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getCurrentUser } from "../services/auth-service.js";

const user = await getCurrentUser().catch(() => null);
await renderNavbar("..", user);
renderFooter();
