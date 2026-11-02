// Strumento instabile (CI 7ebe016, «360 bracci»: page.goto fermo 30 s con i bracci in parallelo, tre tentativi):
// ogni navigazione dei giri di browser aspetta fino a 60 s, come i clic di 464820e e 4b93a14. È un'attesa, non una soglia.
export const ATTESA_NAVIGAZIONE = 60_000;
export function pazienza(browser) {
  const pagina = browser.newPage.bind(browser), contesto = browser.newContext.bind(browser);
  browser.newPage = async (...x) => { const p = await pagina(...x); p.setDefaultNavigationTimeout(ATTESA_NAVIGAZIONE); return p; };
  browser.newContext = async (...x) => { const c = await contesto(...x); c.setDefaultNavigationTimeout(ATTESA_NAVIGAZIONE); return c; };
  return browser;
}
