/* Aplica o tema (claro/escuro) antes de pintar a página, para não piscar.
   Ordem: escolha salva > preferência do sistema. */
(function () {
  var t = null;
  try { t = localStorage.getItem("cs_tema"); } catch (e) { /* sem armazenamento: segue o sistema */ }
  var q = /[?&]tema=(claro|escuro)/.exec(location.search); if (q) t = q[1];
  if (t !== "claro" && t !== "escuro") {
    t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  document.documentElement.setAttribute("data-tema", t);
})();
