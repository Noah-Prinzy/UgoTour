import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getSavedPlaces, removeSavedPlace } from "../services/saved-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";

const user = await requireAuthenticatedUser("..");
await renderNavbar("..", user); renderFooter();
const list=document.getElementById("saved-list"), empty=document.getElementById("saved-empty"), status=document.getElementById("saved-status");
let places=[];

function detailMapUrl(place){ return `./map.html?focus=${place.placeType}:${Number(place.id)}`; }
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function render(){
  list.innerHTML=""; empty.hidden=places.length!==0; list.hidden=places.length===0; status.textContent=`${places.length} favorite place${places.length===1?"":"s"}`;
  places.forEach((place)=>{
    const card=document.createElement("article"); card.className="saved-card";
    card.innerHTML=`<a class="saved-card-link" href="${detailMapUrl(place)}"><img src="${esc(resolveAssetPath(place.imageUrl,".."))}" alt="${esc(place.name)}" loading="lazy"/><div><span class="tag">${esc(place.category||place.placeType)}</span><h2>${esc(place.name)}</h2><p>${esc(place.destinationName?`Near ${place.destinationName}`:(place.region||"Uganda"))}</p><span>Find on map →</span></div></a><button class="saved-remove" type="button" aria-label="Remove ${esc(place.name)} from favorites">♥</button>`;
    card.querySelector(".saved-remove").addEventListener("click",async()=>{const b=card.querySelector(".saved-remove");b.disabled=true;await removeSavedPlace(place.placeType,place.id);places=places.filter((p)=>!(p.placeType===place.placeType&&p.id===place.id));render();});
    list.appendChild(card);
  });
}
try{places=await getSavedPlaces();render();}catch(error){status.textContent=error.message;}
