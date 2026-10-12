/**
 * The front page's stylesheet: a data sheet on warm off-white, ink text, one orange for the primary action and a dark
 * console for the product's own output (Refero style "Fingerprint", translated; see the PR). The font faces are added
 * in front-page.ts. One motion moment: the console resolves the recorded call; prefers-reduced-motion shows it finished.
 */

export const PAGE_STYLE = String.raw`:root{
  color-scheme:light;
  --canvas:#fafaf8;--ink:#141415;--graphite:#454542;--light:#f0f0ef;--ash:#e4e5e1;--stone:#8c8c89;--white:#fff;
  --orange:#f35b22;--orange-edge:#be400f;--green:#62b06d;--green-ink:#8fd19a;--teal:#88d2c3;--blue:#8bc5f3;
  --monitor:#abb2bf;--console:#2e2e2c;--console-line:#454542;--alert:#f67978;--paper:#ecece6;
  --sans:"Schibsted Grotesk",ui-sans-serif,system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --module:rgba(228,229,225,.3) 0 1px 0 0 inset,rgba(110,111,109,.1) 0 -1px 0 0 inset;
  --btn:rgba(24,25,22,.02) 0 2px 1px 0,rgba(24,25,22,.1) 0 -1px 0 0 inset;
  --btn-hover:rgba(255,255,255,.2) 0 1px 0 0 inset,rgba(24,25,22,.06) 0 1px 2px 0,rgba(24,25,22,.1) 0 -1px 0 0 inset;
  --ease:cubic-bezier(.16,1,.3,1);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-padding-top:80px}
body{margin:0;background:var(--canvas);color:var(--ink);font:400 16px/1.6 var(--sans);font-feature-settings:"kern";-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;caret-color:var(--orange)}
::selection{background:rgba(243,91,34,.22);color:var(--ink)}
.console ::selection{background:rgba(136,210,195,.3);color:#fff}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{text-decoration-color:var(--orange)}
:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:4px}
.console :focus-visible,.snip :focus-visible{outline-color:var(--teal)}
code,pre,kbd{font-family:var(--mono);font-size:.875em;letter-spacing:.001em}
h1,h2,h3{font-weight:600;margin:0;text-wrap:balance}
p{margin:0}
.vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip{position:absolute;left:16px;top:-48px;z-index:20;background:var(--ink);color:var(--canvas);padding:8px 14px;border-radius:6px;text-decoration:none}
.skip:focus{top:12px}
.wrap{max-width:1232px;margin:0 auto;padding:0 24px}
svg.i{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}

/* Bar */
.bar{position:sticky;top:0;z-index:10;background:rgba(250,250,248,.94);border-bottom:1px solid var(--ash);backdrop-filter:saturate(1.2) blur(8px);-webkit-backdrop-filter:saturate(1.2) blur(8px)}
.bar .wrap{display:flex;align-items:center;gap:32px;height:64px}
.mark{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:600;font-size:17px;letter-spacing:-.01em;white-space:nowrap}
.mark svg{width:22px;height:22px}
.mark span{color:var(--graphite);font-weight:400;font-size:15px}
.nav{display:flex;gap:28px;margin-left:auto;font-size:15px}
.nav a{text-decoration:none;color:var(--graphite)}
.nav a:hover{color:var(--ink)}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:8px 16px;border-radius:6px;font:600 15px/1.2 var(--sans);text-decoration:none;cursor:pointer;border:1px solid transparent;transition:box-shadow .15s var(--ease),background-color .15s var(--ease),transform .15s var(--ease)}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--orange);color:var(--ink);border-color:var(--orange-edge);box-shadow:var(--btn)}
.btn-primary:hover{background:#f56a35;box-shadow:var(--btn-hover)}
.btn-default{background:var(--canvas);color:var(--ink);border-color:#d9d9d9;box-shadow:var(--btn);font-weight:400}
.btn-default:hover{background:var(--white);box-shadow:var(--btn-hover)}
.btn-default code{font-size:13px}
.btn[data-state="done"] .label-idle{display:none}
.btn:not([data-state="done"]) .label-done{display:none}

/* Hero */
.hero{padding:56px 0 72px}
.hero .wrap{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);gap:48px;align-items:start}
.hero h1{font-size:48px;line-height:1.15;letter-spacing:-.02em;max-width:12.5em}
.lead{margin-top:20px;font-size:17px;line-height:1.6;color:var(--graphite);max-width:34em}
.spec{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:28px 0 0;border-top:1px solid var(--ash);border-bottom:1px solid var(--ash)}
.spec div{padding:12px 0 12px 16px;border-left:1px solid var(--ash)}
.spec div:first-child{padding-left:0;border-left:0}
.spec dt{font:400 12px/1.4 var(--mono);color:var(--graphite)}
.spec dd{margin:4px 0 0;font-weight:600;font-size:16px;line-height:1.3}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.strings{margin:16px 0 0;border:1px solid var(--ash);border-radius:6px;background:var(--white);box-shadow:var(--module)}
.strings div{display:grid;grid-template-columns:5.5rem minmax(0,1fr);align-items:center;gap:8px;padding:6px 6px 6px 12px}
.strings div+div{border-top:1px solid var(--ash)}
.strings dt{font:400 12px/1.4 var(--mono);color:var(--graphite)}
.strings dd{margin:0;display:flex;align-items:center;gap:8px;min-width:0}
.strings code{flex:1;min-width:0;font-size:13px;overflow-wrap:anywhere}
.icon-btn{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--graphite);cursor:pointer}
.icon-btn:hover{border-color:var(--ash);background:var(--canvas);color:var(--ink)}
.icon-btn[data-state="done"]{color:#2f7a3a}
.note{display:flex;gap:8px;margin-top:20px;font-size:14px;line-height:1.5;color:var(--graphite);max-width:34em}
.note svg{margin-top:2px}
.note strong{color:var(--ink);font-weight:600}

/* Console module */
.module{margin:0;background:var(--paper);border:1px solid var(--ash);border-radius:12px;padding:8px;box-shadow:var(--module)}
.console{background:var(--console);color:var(--monitor);border-radius:8px;font:400 13px/1.6 var(--mono);overflow:hidden}
.c-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--console-line);font-size:12px}
.c-pill{border:1px solid #5a5a56;border-radius:4px;padding:1px 6px;color:var(--monitor)}
.c-tool{color:#f0f0ec}
.c-route{margin-left:auto;color:var(--monitor);white-space:nowrap}
.c-req{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word;font-size:13px}
.k1{color:var(--blue)} .s1{color:var(--teal)}
.c-split{display:flex;align-items:center;gap:10px;padding:0 16px;font-size:11px;color:var(--monitor)}
.c-split::before,.c-split::after{content:"";height:1px;background:var(--console-line);flex:1}
.c-split b{font-weight:400;color:var(--green-ink)}
.c-split .sweep{position:relative}
.c-rows{margin:0;padding:12px 16px 4px}
.c-row{display:grid;grid-template-columns:168px minmax(0,1fr);gap:12px;padding:7px 0;border-bottom:1px dashed #3d3d3a}
.c-row:last-child{border-bottom:0}
.c-row dt{color:var(--monitor);font-size:12px}
.c-row dd{margin:0;color:#ecece8;font-size:13px;overflow-wrap:anywhere}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid #5a5a56;border-radius:4px;padding:0 6px;color:#ecece8;font-size:12px;line-height:20px}
.ok{display:inline-flex;align-items:center;gap:6px;color:var(--green-ink)}
.ok::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--green)}
.verdict{display:grid;grid-template-columns:168px minmax(0,1fr);gap:12px;align-items:baseline;margin:4px 16px 0;padding:14px 0 16px;border-top:1px solid var(--console-line)}
.verdict dt{color:var(--monitor);font-size:12px}
.verdict dd{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px}
.verdict .risk{font-size:26px;line-height:1.1;color:var(--alert);letter-spacing:-.01em}
.verdict .why{font-size:12px;color:var(--monitor)}
.c-caveat{margin:0 16px 16px;padding:10px 12px;border:1px solid #454542;border-radius:6px;font-size:12px;line-height:1.55;color:var(--monitor)}
.c-caveat code{color:#ecece8;font-size:12px}
.m-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:12px 8px 4px;font-size:13px;color:var(--graphite)}
.m-foot .src{flex:1;min-width:16em}
.m-foot .btn{min-height:34px;padding:6px 12px;font-size:14px}
.live{flex-basis:100%;font-size:13px;color:var(--graphite)}
.live:empty{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.live[data-tone="good"]{color:#276e35}
.live[data-tone="bad"]{color:#a33c10}

/* The one motion moment: the call resolves */
@media (prefers-reduced-motion:no-preference){
  .run .c-split .sweep{animation:sweep .9s var(--ease) both .25s}
  .run .c-row,.run .verdict,.run .c-caveat{animation:resolve .7s var(--ease) both}
  .run .c-row:nth-child(1){animation-delay:.75s}
  .run .c-row:nth-child(2){animation-delay:.85s}
  .run .c-row:nth-child(3){animation-delay:.95s}
  .run .c-row:nth-child(4){animation-delay:1.05s}
  .run .c-row:nth-child(5){animation-delay:1.15s}
  .run .verdict{animation:land .9s var(--ease) both 1.4s}
  .run .c-caveat{animation-delay:1.75s}
}
@keyframes sweep{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes resolve{from{opacity:0;transform:translateY(6px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
@keyframes land{0%{opacity:0;filter:blur(6px)}60%{opacity:1;filter:none}100%{opacity:1}}

/* Sections */
section.block{padding:72px 0;border-top:1px solid var(--ash)}
.split{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:48px;align-items:start}
.block h2{font-size:36px;line-height:1.15;letter-spacing:-.02em}
.block .intro{margin-top:16px;font-size:16px;color:var(--graphite);max-width:30em}
.block .intro + .intro{margin-top:12px}
.more{display:inline-flex;align-items:center;gap:6px;margin-top:20px;font-size:15px}

/* Data sheet */
.sheet{list-style:none;margin:0;padding:0;border-top:1px solid var(--ink)}
.sheet .row{display:grid;gap:16px;padding:14px 0;border-bottom:1px solid var(--ash);align-items:baseline}
.sheet .head{font:400 12px/1.4 var(--mono);color:var(--graphite);padding:10px 0}
.tools .row{grid-template-columns:minmax(0,17.5rem) minmax(0,1fr) minmax(0,10.5rem)}
.tools .name{font:400 13px/1.5 var(--mono);color:var(--ink);overflow-wrap:anywhere}
.tools .what{font-size:15px;line-height:1.5}
.tools .basis{font:400 12px/1.5 var(--mono);color:var(--graphite)}
.tools .row:not(.head):hover{background:linear-gradient(90deg,rgba(243,91,34,.05),transparent 60%)}
.extra{margin-top:16px;font-size:14px;color:var(--graphite)}
.evidence .row{grid-template-columns:minmax(0,9rem) minmax(0,1fr) minmax(0,8.5rem) minmax(0,8.5rem)}
.evidence .m{font-weight:600;font-size:15px}
.evidence .v{font-size:15px;line-height:1.5}
.evidence .v strong{font:400 22px/1.2 var(--mono);letter-spacing:-.01em;margin-right:6px}
.evidence .s,.evidence .d{font:400 12px/1.5 var(--mono);color:var(--graphite);overflow-wrap:anywhere}

/* Connect */
.connect-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:32px}
.way{display:flex;flex-direction:column;gap:12px;padding:20px;border:1px solid var(--ash);border-radius:12px;background:var(--canvas);box-shadow:var(--module)}
.way h3{font-size:16px}
.way p{font-size:14px;line-height:1.6;color:var(--graphite)}
.snip{display:flex;align-items:flex-start;gap:8px;margin-top:auto;padding:10px 8px 10px 12px;border-radius:8px;background:var(--console);color:#ecece8}
.snip code,.snip pre{flex:1;min-width:0;margin:0;font-size:12.5px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.snip .icon-btn{color:var(--monitor);width:28px;height:28px}
.snip .icon-btn:hover{border-color:#5a5a56;background:#3a3a37;color:#fff}
.snip .icon-btn[data-state="done"]{color:var(--green-ink)}
.way .btn{align-self:flex-start;margin-top:auto}
.first{margin-top:20px;font-size:14px;color:var(--graphite)}

/* Disclaimer and privacy */
.fine{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:48px}
.fine h3{font-size:22px;line-height:1.25;letter-spacing:-.01em}
.fine p{margin-top:12px;font-size:15px;line-height:1.65;color:var(--graphite);max-width:36em}
.fine .disc{padding-left:20px;border-left:1px solid var(--ink)}

/* Footer */
footer{border-top:1px solid var(--ink);padding:40px 0 48px;font-size:14px;color:var(--graphite)}
footer .wrap{display:grid;grid-template-columns:minmax(0,5fr) repeat(2,minmax(0,2.5fr));gap:32px}
footer h2{font:400 12px/1.4 var(--mono);color:var(--graphite);margin-bottom:10px}
footer ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
footer a{color:var(--ink)}
footer .who p+p{margin-top:6px}
footer .who strong{color:var(--ink);font-weight:600}

/* Narrow screens */
@media (max-width:1040px){
  .hero .wrap,.split{grid-template-columns:minmax(0,1fr)}
  .hero h1{max-width:16em}
  .connect-grid{grid-template-columns:minmax(0,1fr)}
  .evidence .row{grid-template-columns:minmax(0,9rem) minmax(0,1fr)}
  .evidence .s,.evidence .d{grid-column:2}
}
@media (max-width:720px){
  .wrap{padding:0 16px}
  .nav{display:none}
  .bar .wrap{gap:12px;justify-content:space-between}
  .mark span{display:none}
  .bar .btn{min-height:36px;padding:6px 12px;font-size:14px}
  .hero{padding:32px 0 48px}
  .hero h1{font-size:34px;line-height:1.15}
  .lead{font-size:16px}
  .spec{grid-template-columns:minmax(0,1fr)}
  .spec div{padding:10px 0;border-left:0;border-top:1px solid var(--ash);display:flex;justify-content:space-between;gap:16px}
  .spec div:first-child{border-top:0}
  .spec dd{margin:0;text-align:right}
  .actions .btn{flex:1 1 100%}
  .strings div{grid-template-columns:minmax(0,1fr);gap:2px;padding:8px 6px 8px 12px}
  .strings code{font-size:12px}
  .c-head{flex-wrap:wrap}
  .c-route{margin-left:0;flex-basis:100%}
  .c-row,.verdict{grid-template-columns:minmax(0,1fr);gap:2px}
  section.block{padding:48px 0}
  .block h2{font-size:28px}
  .sheet .head{display:none}
  .tools .row,.evidence .row{grid-template-columns:minmax(0,1fr);gap:4px}
  .evidence .s,.evidence .d{grid-column:auto}
  .fine{grid-template-columns:minmax(0,1fr);gap:32px}
  footer .wrap{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  footer .who{grid-column:1/-1}
}
@media (max-width:400px){footer .wrap{grid-template-columns:minmax(0,1fr)}}
@media (max-width:720px),(pointer:coarse){
  .btn,.bar .btn{min-height:44px}
  .icon-btn,.snip .icon-btn{width:44px;height:44px}
  .m-foot .btn{min-height:44px}
}
@media (max-width:360px){
  .hero h1{font-size:30px}
  .c-req,.c-rows,.c-split{padding-left:12px;padding-right:12px}
  .verdict,.c-caveat{margin-left:12px;margin-right:12px}
}
`;
