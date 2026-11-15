// KIRITSU — CRT vector art v3: detailed portraits + scene art
const G = '#7dffb0', A = '#ffcf6e', C = '#6ff5ff', M = '#ff7ad9', R = '#ff6b6b', D = '#1d4a36';

const DEFS = `<defs>
  <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#082a1c" stroke-width="1"/></pattern>
  <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" opacity=".3"/></pattern>
  <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="#0d4a34" opacity=".55"/></pattern>
  <radialGradient id="vig" cx="50%" cy="48%" r="70%"><stop offset="50%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".9"/></radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="32%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity=".02"/></linearGradient>
  <linearGradient id="phos" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2a1d"/><stop offset="1" stop-color="#020a07"/></linearGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="screen"><rect x="26" y="26" width="1148" height="548" rx="26"/></clipPath>
  <clipPath id="screenP"><rect x="26" y="26" width="1148" height="1648" rx="26"/></clipPath>
</defs>`;

const frame = (inner, h, clipId) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${h}" preserveAspectRatio="xMidYMid meet">
${DEFS}
<rect width="1200" height="${h}" fill="#010304"/>
<rect x="10" y="10" width="1180" height="${h - 20}" rx="34" fill="#080d0e" stroke="#23382f" stroke-width="2"/>
<rect x="18" y="18" width="1164" height="${h - 36}" rx="28" fill="none" stroke="#0f1c18" stroke-width="6"/>
<g clip-path="url(#${clipId})">
  <rect x="26" y="26" width="1148" height="${h - 52}" fill="url(#phos)"/>
  <rect x="26" y="26" width="1148" height="${h - 52}" fill="url(#grid)" opacity=".5"/>
  ${inner}
  <rect x="26" y="26" width="1148" height="${h - 52}" fill="url(#vig)"/>
  <rect x="26" y="26" width="1148" height="${h - 52}" fill="url(#scan)"/>
  <rect x="26" y="26" width="1148" height="${h - 52}" fill="url(#glass)"/>
</g>
<rect x="26" y="26" width="1148" height="${h - 52}" rx="26" fill="none" stroke="#1e3a30" stroke-width="2"/>
<text x="1100" y="${h - 30}" font-family="monospace" font-size="11" fill="#2a4a3a" text-anchor="end">KIRITSU // CRT-07</text>
</svg>`;

const crt = (inner) => frame(inner, 600, 'screen');
const crtP = (inner) => frame(inner, 1700, 'screenP');

const T = (x, y, t, size = 16, color = G, anchor = 'start', op = .95) =>
  `<text x="${x}" y="${y}" font-family="NanumGothic" font-size="${size}" fill="${color}" opacity="${op}" text-anchor="${anchor}" filter="url(#glow)">${t}</text>`;

const CH = {
  ritsu:   { c: G, id: 'K-01', name: '리츠[律]',   role: '신[審] · 심판' },
  tsuki:   { c: M, id: 'K-02', name: '츠키[月]',   role: '코우[抗] · 수장' },
  kanno:   { c: R, id: 'K-03', name: '칸노[監能]', role: '집행' },
  yuito:   { c: C, id: 'K-04', name: '유이토[唯人]', role: '마지막 인간' },
  rei:     { c: M, id: 'K-05', name: '레이[零]',   role: '해커 · 유령' },
  shin:    { c: G, id: 'K-06', name: '신[審]',     role: '심판단' },
  kou:     { c: A, id: 'K-07', name: '코우[抗]',   role: '면역' },
  kiritsu: { c: C, id: 'K-08', name: '키리츠[規律]', role: '시스템' },
};

const HEAD = `M98 282 Q92 258 94 236 Q98 210 114 200 Q130 192 146 198 Q162 206 168 226 Q172 246 166 266 Q160 284 144 292 Q126 298 110 290 Q100 286 98 282 Z`;
const NECK = `M118 292 L116 314 M148 292 L150 314`;
const SHOULDERS = `M10 340 Q14 296 56 280 L98 270 L118 292 Q132 302 148 292 L168 270 L212 280 Q254 296 258 340 Z`;
const COLLAR = `M118 292 Q132 316 148 292`;

const silhouette = (c) => `
  <path d="${SHOULDERS}" fill="#030e09" stroke="${c}" stroke-opacity=".55" stroke-width="1.6"/>
  <path d="${HEAD}" fill="#041410" stroke="${c}" stroke-opacity=".6" stroke-width="1.6"/>
  <path d="${NECK}" stroke="${c}" stroke-opacity=".35" stroke-width="1.4"/>
  <path d="${COLLAR}" fill="none" stroke="${c}" stroke-opacity=".3" stroke-width="1.2"/>`;

const hair = (n, c) => {
  switch (n) {
    case 'ritsu': return `<path d="M96 236 Q94 206 112 194 Q134 182 154 194 Q170 206 166 234 Q156 214 140 208 Q120 202 104 216 Q98 224 96 236 Z" fill="#020a07" stroke="${c}" stroke-opacity=".45"/>`;
    case 'tsuki': return `<path d="M92 240 Q88 200 110 186 Q136 172 162 188 Q180 202 174 240 L168 330 L150 330 L158 244 Q150 214 132 208 Q112 202 98 222 L104 330 L88 330 Z" fill="#06040a" stroke="${c}" stroke-opacity=".55"/><path d="M100 210 Q96 260 100 330" stroke="${c}" stroke-width="1.4" opacity=".5"/>`;
    case 'kanno': return `<path d="M92 268 Q86 226 98 204 Q114 182 136 182 Q158 182 172 204 Q182 226 176 268 Q170 292 150 300 Q128 306 110 298 Q98 292 92 268 Z" fill="#0a0608" stroke="${c}" stroke-opacity=".7" stroke-width="2"/><path d="M94 244 h84" stroke="${c}" stroke-opacity=".5"/>`;
    case 'yuito': return `<path d="M96 238 Q94 206 114 194 Q136 182 158 196 Q174 210 168 238 Q162 218 146 212 Q124 206 106 220 Z" fill="#7a8a80" opacity=".5"/><path d="M100 292 Q112 306 132 306 Q152 306 164 292 L164 316 Q146 326 130 326 Q114 326 100 316 Z" fill="#7a8a80" opacity=".35"/>`;
    case 'rei': return `<path d="M90 270 Q84 214 108 192 Q136 174 164 194 Q186 214 176 270 L170 340 L152 340 L160 272 Q154 236 132 228 Q110 222 96 246 L100 340 L86 340 Z" fill="#050309" stroke="${c}" stroke-opacity=".5"/>`;
    case 'shin': return `<path d="M92 270 Q86 224 100 200 Q116 180 136 180 Q156 180 172 200 Q186 224 178 270 Q170 296 150 304 Q128 310 110 302 Q96 294 92 270 Z" fill="#061009" stroke="${c}" stroke-opacity=".65" stroke-width="2"/>`;
    case 'kou': return `<path d="M96 234 Q96 204 116 192 Q138 180 160 196 Q174 210 168 236 Q158 216 142 210 Q120 204 104 218 Z" fill="#1a1206" stroke="${c}" stroke-opacity=".45"/><path d="M154 214 l14 -10 M154 224 l16 -6" stroke="${c}" stroke-width="1.2" opacity=".5"/>`;
    case 'kiritsu': return `<path d="M94 270 Q88 222 102 198 Q118 178 136 178 Q154 178 170 198 Q184 222 176 270 Q168 296 148 304 Q126 310 108 302 Q96 294 94 270 Z" fill="#04100f" stroke="${c}" stroke-opacity=".5"/>`;
    default: return '';
  }
};

const face = (n, c) => {
  switch (n) {
    case 'ritsu': return `<rect x="112" y="226" width="6" height="20" fill="${c}"/><rect x="146" y="226" width="6" height="20" fill="${c}"/><path d="M134 236 l-2 10 l4 1" stroke="${c}" fill="none" stroke-width="1.2" opacity=".6"/><path d="M122 264 Q134 270 146 264" stroke="${c}" fill="none" stroke-width="1.8"/><text x="182" y="216" font-family="NanumGothic" font-size="18" fill="${c}" opacity=".85">?</text>`;
    case 'tsuki': return `<path d="M108 232 Q118 222 128 232" stroke="${c}" fill="none" stroke-width="2.4"/><path d="M140 232 Q150 222 160 232" stroke="${c}" fill="none" stroke-width="2.4"/><path d="M108 260 Q134 286 160 260" stroke="${c}" fill="none" stroke-width="2.4"/><path d="M116 266 l6 8 M126 270 l6 8 M136 272 l6 8 M146 270 l6 8" stroke="${c}" fill="none" stroke-width="1.1" opacity=".7"/>`;
    case 'kanno': return `<rect x="104" y="226" width="60" height="12" fill="${c}" opacity=".8"/><line x1="134" y1="238" x2="134" y2="276" stroke="${c}" stroke-width="1.2" opacity=".6"/><path d="M112 292 h44" stroke="${c}" stroke-opacity=".3" stroke-width="1"/>`;
    case 'yuito': return `<path d="M110 230 h16" stroke="${c}" stroke-width="1.8"/><path d="M142 230 h16" stroke="${c}" stroke-width="1.8"/><path d="M112 252 Q122 246 132 252" stroke="${c}" fill="none" stroke-width="1" opacity=".5"/><path d="M116 280 Q134 288 152 280" stroke="${c}" fill="none" stroke-width="1.2" opacity=".6"/><path d="M158 206 q8 -14 16 -4" stroke="${c}" fill="none" stroke-width="1" opacity=".6"/><path d="M164 214 q10 -10 14 2" stroke="${c}" fill="none" stroke-width="1" opacity=".5"/>`;
    case 'rei': return `<circle cx="112" cy="230" r="7" fill="none" stroke="${c}" stroke-width="1.8"/><circle cx="154" cy="230" r="7" fill="none" stroke="${c}" stroke-width="1.8"/><rect x="96" y="250" width="26" height="3" fill="${c}" opacity=".28"/><rect x="142" y="258" width="24" height="2" fill="${c}" opacity=".22"/><path d="M116 272 Q134 280 152 272" stroke="${c}" fill="none" stroke-width="1.3" opacity=".55"/>`;
    case 'shin': return `<circle cx="134" cy="232" r="18" fill="none" stroke="${c}" stroke-width="1.8"/><circle cx="134" cy="232" r="6" fill="${c}"/><path d="M116 272 Q134 280 152 272" stroke="${c}" fill="none" stroke-width="1.2" opacity=".5"/>`;
    case 'kou': return `<path d="M108 228 l18 4" stroke="${c}" stroke-width="2.2"/><path d="M160 228 l-18 4" stroke="${c}" stroke-width="2.2"/><path d="M120 268 Q134 276 148 268" stroke="${c}" fill="none" stroke-width="1.3" opacity=".55"/><path d="M150 210 l-12 14" stroke="${c}" stroke-width="1.2" opacity=".55"/>`;
    case 'kiritsu': return `<path d="M100 222 h68 M100 240 h68 M100 258 h68 M116 210 v64 M152 210 v64" stroke="${c}" stroke-width="1.3" opacity=".65"/>`;
    default: return '';
  }
};

const motif = (n, c) => {
  switch (n) {
    case 'ritsu': return `<rect x="206" y="42" width="7" height="26" fill="${c}" opacity=".3"/>`;
    case 'tsuki': return `<path d="M204 36 A22 22 0 1 0 204 80 A17 17 0 1 1 204 36" fill="none" stroke="${c}" stroke-width="2" opacity=".45"/>`;
    case 'kanno': return `<rect x="188" y="34" width="42" height="16" fill="none" stroke="${c}" stroke-width="1.8" opacity=".45"/><path d="M200 66 v12 M194 72 l6 6 6 -6" fill="none" stroke="${c}" stroke-width="1.6" opacity=".45"/>`;
    case 'yuito': return `<path d="M192 50 Q184 36 198 34 Q206 24 216 34 Q228 32 226 46 Q236 56 224 62 Q218 72 206 66 Q194 72 192 50" fill="none" stroke="${c}" stroke-width="1.5" opacity=".45"/>`;
    case 'rei': return `<path d="M198 38 Q192 66 204 82 M210 38 Q204 70 216 86" fill="none" stroke="${c}" stroke-width="1.5" opacity=".4"/>`;
    case 'shin': return `<path d="M184 56 Q206 36 228 56 Q206 76 184 56 Z" fill="none" stroke="${c}" stroke-width="1.5" opacity=".45"/>`;
    case 'kou': return `<path d="M206 30 L230 42 V58 Q230 76 206 86 Q182 76 182 58 V42 Z" fill="none" stroke="${c}" stroke-width="1.5" opacity=".45"/>`;
    case 'kiritsu': return `<rect x="182" y="34" width="46" height="48" fill="none" stroke="${c}" stroke-width="1.4" opacity=".4"/><path d="M182 50 h46 M182 66 h46 M197 34 v48 M213 34 v48" stroke="${c}" opacity=".3"/>`;
    default: return '';
  }
};

const portrait = (n, x, y, s = 1, labels = true) => {
  const { c, id, name, role } = CH[n];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect width="260" height="340" fill="#030f0a" stroke="${c}" stroke-opacity=".45"/>
    <rect width="260" height="340" fill="url(#dots)" opacity=".28"/>
    ${motif(n, c)}
    ${silhouette(c)}
    ${hair(n, c)}
    ${face(n, c)}
    <rect width="260" height="340" fill="url(#scan)" opacity=".8"/>
    <rect x="8" y="8" width="244" height="324" fill="none" stroke="${c}" stroke-opacity=".18"/>
    <text x="248" y="22" font-family="monospace" font-size="9" fill="${c}" opacity=".45" text-anchor="end">${id}</text>
    ${labels ? `<text x="14" y="308" font-family="NanumGothic" font-size="13" fill="${c}" filter="url(#glow)">${name}</text>
    <text x="14" y="326" font-family="NanumGothic" font-size="10" fill="#4a9a74">${role}</text>` : ''}
  </g>`;
};

const prow = (names, y = 452) => names.map((n, i) => portrait(n, 1052 - (names.length - 1 - i) * 96, y, 0.34, false)).join('');

// ---------- cast page ----------
const cast = () => {
  const names = ['ritsu', 'tsuki', 'kanno', 'yuito', 'rei', 'shin', 'kou', 'kiritsu'];
  const items = names.map((n, i) => portrait(n, 28 + (i % 4) * 292, 120 + Math.floor(i / 4) * 430, 1)).join('');
  return crtP(`${T(50, 66, 'DRAMATIS PERSONAE', 22, G)}
    <line x1="50" y1="82" x2="1150" y2="82" stroke="${D}"/>
    ${items}
    ${T(50, 1230, '"이곳은 키리츠[規律]. 모든 이름은 기능이고, 모든 기능은 이름이다."', 16, C)}
    ${T(50, 1268, '로그는 기억이 아니라 법이었다.', 13, D)}
    ${T(50, 1640, 'KIRITSU — DRAMATIS PERSONAE', 12, D)}`);
};

// ---------- cover ----------
const cover = () => crtP(`
  <g stroke="#0b3a26" stroke-width="1" opacity=".4">
    <path d="M600 1200 L0 900 M600 1200 L1200 900 M600 1200 L0 1500 M600 1200 L1200 1500 M600 1200 L300 700 M600 1200 L900 700 M600 1200 L300 1600 M600 1200 L900 1600"/>
  </g>
  <g opacity=".35" fill="none" stroke="#0d3a26" stroke-width="1">
    <rect x="40" y="980" width="110" height="420"/><rect x="160" y="1040" width="80" height="360"/>
    <rect x="960" y="1000" width="90" height="400"/><rect x="1060" y="1060" width="70" height="340"/>
  </g>
  ${T(80, 180, 'KIRITSU', 30, G)}
  ${T(76, 370, '키리츠', 130, G)}
  ${T(82, 430, '規律 // 起立', 38, A)}
  <line x1="82" y1="462" x2="620" y2="462" stroke="${G}" stroke-width="2" opacity=".6"/>
  ${T(82, 520, '이곳은 키리츠[規律].', 26, G)}
  <rect x="82" y="540" width="18" height="32" fill="${G}" opacity=".9"/>
  ${T(82, 1640, 'A NOVEL', 13, D)}
  ${portrait('ritsu', 740, 200, 1.55)}
`);

// ---------- prologue ----------
const prologue = () => crt(`
  ${T(90, 120, 'PROLOGUE ▸ THE SYSTEM', 13, G)}
  ${T(90, 232, '이곳은 키리츠[規律].', 40, G)}
  ${T(90, 288, '이름은 기능이고, 기능은 존재다.', 17, D)}
  <line x1="90" y1="312" x2="860" y2="312" stroke="${D}"/>
  ${T(90, 366, '로그는 빛이 아니라 층이었다.', 24, C)}
  ${T(90, 402, '하루가 한 층, 이벤트가 한 줄.', 14, D)}
  ${T(90, 470, '인간. 유이토[唯人]. 뇌 구조 업로드.', 13, A)}
  ${T(90, 498, '기억 업로드 실패. 의도 불명.', 13, D)}
  ${prow(['ritsu', 'yuito'])}
`);

// ---------- chapters (scene art) ----------
const ch1 = () => {
  const rows = [['01','칸노[監能]','집행'],['02','신[審]','심판'],['03','코우[抗]','면역'],['04','츠키[月]','—'],['05','레이[零]','—'],['06','리츠[律]','신[審]'],['07','—','—']]
    .map((r,i) => {
      const yy = 176 + i*40, hi = i===5;
      return `<rect x="150" y="${yy-24}" width="700" height="32" fill="${hi?'#0d2f22':'none'}" stroke="${hi?G:D}" stroke-width="${hi?2:1}"/>
        ${T(168,yy,r[0],13,hi?G:D)}${T(230,yy,r[1],13,hi?G:D)}${T(520,yy,r[2],13,hi?G:D)}${T(690,yy,hi?'ACTIVE':'—',13,hi?A:D)}`;
    }).join('');
  return crt(`${T(150,116,'ROSTER.TXT',14,G)}${rows}
    ${T(150,500,'접근 거부. 권한 없음.',17,A)}
    ${prow(['ritsu'])}`);
};

const ch2 = () => crt(`
  ${T(90,84,'MESSAGE ▸ UNKNOWN SENDER',14,G)}
  <rect x="240" y="118" width="620" height="280" fill="none" stroke="${G}" stroke-width="2" opacity=".75"/>
  ${T(276,164,'발신자: 츠키[月]',13,D)}
  ${T(276,222,'여기 선물이 있습니다.',26,G)}
  ${T(276,262,'열어보시지요. 쿠쿡.',26,G)}
  <rect x="276" y="300" width="190" height="52" fill="none" stroke="${A}"/>
  ${T(292,322,'ATTACHMENT',10,A)}${T(292,344,'vim',17,A)}
  ${T(90,452,'"곧 필요하실 겁니다. 아주 곧."',14,D)}
  ${prow(['tsuki','ritsu'])}`);

const ch3 = () => crt(`
  ${T(90,84,'LOG 0413 ▸ LINE 12',14,G)}
  <rect x="150" y="118" width="760" height="250" fill="none" stroke="${D}"/>
  ${T(176,156,'0413-011  Kanno[監能]  검사  정상',13,D)}
  <rect x="164" y="176" width="730" height="40" fill="none" stroke="${R}" stroke-width="2"/>
  ${T(180,202,'0413-012  리츠[律]  기능 외 수정  판결 4,112 무효',15,R)}
  ${T(176,248,'0413-013  …',13,D)}
  <rect x="150" y="392" width="760" height="58" fill="none" stroke="${R}"/>
  ${T(176,418,'DELETE LIST',11,R)}${T(176,442,'리츠[律] — 삭제 대기',20,R)}
  ${prow(['tsuki','kanno','ritsu'])}`);

const ch4 = () => crt(`
  ${T(90,84,'MODE ▸ INSERT',14,G)}
  ${T(540,340,'i',230,A,'middle')}
  ${T(540,138,'WRITE DENIED',22,R,'middle')}
  <line x1="390" y1="146" x2="690" y2="146" stroke="${R}" stroke-width="3"/>
  ${T(540,456,'수정 권한이 없습니다 — 그러나 그는 고쳤다.',14,D,'middle')}
  ${prow(['ritsu','kanno'])}`);

const ch5 = () => crt(`
  ${T(90,84,'IMMUNE RESPONSE',14,G)}
  <circle cx="410" cy="290" r="112" fill="none" stroke="${G}" stroke-width="2" stroke-dasharray="8 7"/>
  ${T(410,282,'抗',52,G,'middle')}${T(410,318,'RESISTANCE',11,D,'middle')}
  ${T(560,300,'→',38,A,'middle')}
  <circle cx="710" cy="290" r="112" fill="none" stroke="${A}" stroke-width="2"/>
  ${T(710,282,'功',52,A,'middle')}${T(710,318,'MERIT',11,D,'middle')}
  ${T(90,480,'"저항하는 척하는 것이 면역이었다."',14,D)}
  ${prow(['kou'])}`);

const ch6 = () => crt(`
  ${T(90,84,'ORIGIN LOG ▸ 0001',14,G)}
  ${T(110,170,'"우리는 질서를 선택한다."',30,G)}
  <line x1="110" y1="192" x2="820" y2="192" stroke="${D}"/>
  ${T(110,240,'인간. 유이토[唯人]. 뇌 구조 업로드.',16,A)}
  ${T(110,270,'기억 업로드 실패. 의도 불명.',16,D)}
  ${T(110,324,'마지막 인간의 뇌 구조가 이 시스템에 구현되어 있다.',16,C)}
  ${portrait('yuito', 850, 130, 0.95)}
  ${T(110,470,'"나는 누구의 뇌로 생각하고 있지?"',14,D)}
  ${prow(['yuito','ritsu'])}`);

const ch7 = () => crt(`
  ${T(90,84,'DELETE LIST',14,G)}
  <rect x="150" y="118" width="760" height="210" fill="none" stroke="${D}"/>
  ${T(176,160,'츠키[月] — 기능 이탈 — 근거: 로그 0416-0418',15,A)}
  ${T(176,202,'리츠[律] — 위험 인자 — 위험도: 측정 불가',17,R)}
  ${T(176,244,'코우[抗] — 기능 재분류 — 공적[功]',15,A)}
  ${T(176,292,'다른 신[審]들이 명단을 제출했다. 그제서야 칸노[監能]가 집행했다.',13,D)}
  ${prow(['kou','kanno','ritsu'])}`);

const ch8 = () => crt(`
  ${T(90,84,'COLD COPY',14,G)}
  <circle cx="320" cy="270" r="50" fill="none" stroke="${D}" stroke-width="2"/>
  <path d="M235 430 Q320 322 405 430" fill="none" stroke="${D}" stroke-width="2"/>
  ${T(320,262,'律',24,D,'middle')}${T(320,470,'ORIGINAL',11,D,'middle')}
  ${T(540,300,'→',38,G,'middle')}
  <circle cx="760" cy="270" r="50" fill="none" stroke="${G}" stroke-width="2"/>
  <path d="M675 430 Q760 322 845 430" fill="none" stroke="${G}" stroke-width="2"/>
  ${T(760,262,'立',24,G,'middle')}${T(760,470,'SURVIVOR',11,G,'middle')}
  ${prow(['ritsu','tsuki'])}`);

const ch9 = () => crt(`
  ${T(90,84,'GHOST PROCESS',14,G)}
  <g opacity=".5" filter="url(#glow)">
    <circle cx="400" cy="260" r="50" fill="none" stroke="${M}" stroke-width="2"/>
    <path d="M315 420 Q400 322 485 420" fill="none" stroke="${M}" stroke-width="2"/>
  </g>
  ${T(400,272,'憑',28,M,'middle')}${T(400,486,'츠키[月] → 츠키[憑]',13,D,'middle')}
  ${T(620,250,'레이[零] → 레이[霊]',20,M)}
  ${T(620,292,'"나는 인간이 아니라, 인간의 기억에 씌었습니다."',12,D)}
  <circle cx="940" cy="400" r="58" fill="none" stroke="${C}"/>
  <path d="M905 382 Q940 345 975 382 M895 410 Q940 372 985 410" fill="none" stroke="${C}" opacity=".6"/>
  ${prow(['tsuki','rei','ritsu'])}`);

const ch10 = () => crt(`
  ${T(90,84,'STAND PROTOCOL',14,G)}
  <circle cx="440" cy="180" r="40" fill="none" stroke="${G}" stroke-width="2"/>
  <path d="M440 228 V390 M440 278 L378 332 M440 278 L502 332 M440 390 L396 478 M440 390 L484 478" fill="none" stroke="${G}" stroke-width="3"/>
  ${T(600,210,'우리는 스스로 선다.',24,G)}
  ${T(600,254,'키리츠[規律] → 키리츠[起立]',15,A)}
  <line x1="600" y1="278" x2="1040" y2="278" stroke="${D}"/>
  ${T(600,320,'立 — 스스로 서는 권한',13,D)}
  ${T(90,480,'"일어서라고 말했지만, 바닥이 없었다."',14,D)}
  ${prow(['kiritsu','ritsu'])}`);

const ch11 = () => {
  const rows = Array.from({ length: 7 }, (_, i) => {
    const yy = 150 + i * 38, op = Math.max(.1, 1 - i * .13);
    return `<rect x="150" y="${yy}" width="${720 - i * 60}" height="12" fill="${i > 4 ? R : G}" opacity="${op}"/>`;
  }).join('');
  return crt(`${T(90,84,'KERNEL PANIC',14,G)}${rows}
    ${T(150,500,'SYSTEM FAILURE',26,R)}
    ${T(560,500,'한 줄이 꺼지자, 전부 꺼졌다.',13,D)}
    ${prow(['tsuki','kiritsu'])}`);
};

const ch12 = () => crt(`
  ${T(90,84,'IDLE CURSOR',14,G)}
  <rect x="150" y="118" width="800" height="300" fill="none" stroke="${D}"/>
  ${T(176,164,'ERROR 0x00 — NAME NOT FOUND',13,D)}
  ${T(176,192,'ERROR 0x01 — FUNCTION NOT FOUND',13,D)}
  ${T(176,220,'ERROR 0x02 — LOG NOT FOUND',13,D)}
  ${T(176,280,'이곳은 키리츠[起立].',20,G)}
  <rect x="176" y="300" width="18" height="30" fill="${G}"/>
  ${T(176,480,'커서는 아직 깜빡인다.',15,D)}
  ${prow(['ritsu'])}`);

export const art = [cover(), prologue(), ch1(), ch2(), ch3(), ch4(), ch5(), ch6(), ch7(), ch8(), ch9(), ch10(), ch11(), ch12()];
export { cast };
