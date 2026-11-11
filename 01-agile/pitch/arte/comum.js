const P={
cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
cruz:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
code:'<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
rede:'<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/>',
graf:'<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
cubo:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
ciclo:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
rota:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
cadeira:'<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
cora:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
escudo:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
nuvem:'<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
troca:'<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
seta:'<path d="M5 12h14M13 6l6 6-6 6"/>'};
const ic=(n,s)=>`<svg class="ic" viewBox="0 0 24 24" ${s?`style="font-size:${s}px"`:''}>${P[n]}</svg>`;
const Q=new URLSearchParams(location.search);const V=(Q.get('v')||'a');
const SHIELD=(s)=>`<span class="logo" style="width:${s}px;height:${s}px;font-size:${s*.58}px">${ic('escudo')}</span>`;
/* Dona Maria: pés em (0,0), altura ~570 */
function maria(){return `<g>
<ellipse cx="0" cy="2" rx="105" ry="13" fill="rgba(0,0,0,.35)"/>
<path d="M-30 -118 V-26 M30 -118 V-26" stroke="#b97a56" stroke-width="22" stroke-linecap="round"/>
<ellipse cx="-30" cy="-10" rx="26" ry="12" fill="#2b1f1a"/><ellipse cx="30" cy="-10" rx="26" ry="12" fill="#2b1f1a"/>
<path d="M-64 -205 H64 L84 -105 Q0 -88 -84 -105 Z" fill="#1d4f73"/>
<path d="M-70 -405 Q-78 -410 -78 -380 L-84 -205 H84 L78 -380 Q78 -410 70 -405 L30 -418 H-30 Z" fill="#0f766e"/>
<path d="M-26 -418 L26 -418 L0 -340 Z" fill="#fff4d6"/>
<path d="M-70 -385 Q-98 -330 -102 -228" stroke="#0f766e" stroke-width="38" stroke-linecap="round" fill="none"/>
<path d="M70 -385 Q96 -330 100 -262" stroke="#0f766e" stroke-width="38" stroke-linecap="round" fill="none"/>
<circle cx="-102" cy="-212" r="19" fill="#b97a56"/><circle cx="100" cy="-246" r="19" fill="#b97a56"/>
<path d="M92 -236 q-2 -42 38 -42 q40 0 38 42" stroke="#9a6b12" stroke-width="7" fill="none"/>
<rect x="84" y="-236" width="94" height="70" rx="14" fill="#f5b83d"/><rect x="84" y="-236" width="94" height="18" rx="9" fill="#e2a226"/>
<rect x="-16" y="-448" width="32" height="40" fill="#a8694a"/>
<circle cx="0" cy="-495" r="58" fill="#b97a56"/>
<circle cx="0" cy="-575" r="26" fill="#d9e0e6"/>
<path d="M-60 -495 A60 60 0 0 1 60 -495 Q46 -540 0 -548 Q-46 -540 -60 -495 Z" fill="#d9e0e6"/>
<circle cx="-22" cy="-496" r="17" fill="rgba(255,255,255,.25)" stroke="#0d2b45" stroke-width="4"/><circle cx="22" cy="-496" r="17" fill="rgba(255,255,255,.25)" stroke="#0d2b45" stroke-width="4"/><path d="M-5 -498 H5" stroke="#0d2b45" stroke-width="4"/>
<circle cx="-22" cy="-496" r="5" fill="#2b1f1a"/><circle cx="22" cy="-496" r="5" fill="#2b1f1a"/>
<path d="M-18 -466 Q0 -450 18 -466" stroke="#6b3a28" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="-38" cy="-474" r="9" fill="#d9885f" opacity=".5"/><circle cx="38" cy="-474" r="9" fill="#d9885f" opacity=".5"/>
</g>`;}
P.pessoas='<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>';
P.predio='<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M3 10h18"/>';
P.loja='<path d="m2 7 1.5-4h17L22 7"/><path d="M2 7a3 3 0 0 0 5.33 2 3 3 0 0 0 5.34 0 3 3 0 0 0 5.33 0A3 3 0 0 0 22 7"/><path d="M4 12v9h16v-9"/><path d="M10 21v-5h4v5"/>';
/* Posto de saude: base em (0,0), largura 520 */
function posto(){return `<g>
<rect x="-260" y="-300" width="520" height="300" rx="10" fill="#e8f1f2"/><rect x="-260" y="-330" width="520" height="40" rx="10" fill="#0f766e"/>
<text x="0" y="-302" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="24" fill="#fff" letter-spacing="3">POSTO DE SAÚDE</text>
<circle cx="0" cy="-205" r="52" fill="#0f766e"/><path d="M0 -233 V-177 M-28 -205 H28" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
<rect x="-215" y="-250" width="80" height="90" rx="8" fill="#9fd3cb"/><rect x="135" y="-250" width="80" height="90" rx="8" fill="#9fd3cb"/>
<rect x="-55" y="-130" width="110" height="130" rx="8" fill="#0d2b45"/><rect x="-45" y="-120" width="42" height="120" fill="#7fc9d8" opacity=".6"/><rect x="3" y="-120" width="42" height="120" fill="#7fc9d8" opacity=".6"/>
</g>`;}
function pessoa(c,s){return `<g transform="scale(${s||1})"><circle cx="0" cy="-34" r="16" fill="${c}"/><path d="M-26 0 Q-26 -22 0 -22 Q26 -22 26 0Z" fill="${c}"/></g>`;}
