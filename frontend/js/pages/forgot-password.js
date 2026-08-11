import { redirectAuthenticatedUser } from "../services/session-guard.js";
import { requestPasswordReset } from "../services/auth-service.js";
await redirectAuthenticatedUser("../index.html");
const form=document.getElementById("forgot-form"), message=document.getElementById("forgot-message"), dev=document.getElementById("forgot-dev-link");
form?.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;const result=await requestPasswordReset(document.getElementById("forgot-email").value);message.textContent=result.message;message.className=`form-message ${result.success?"form-message-success":"form-message-error"}`;if(result.developmentResetUrl){dev.hidden=false;dev.innerHTML=`Development only: <a href="${result.developmentResetUrl}">open reset page</a>`;}button.disabled=false;});
