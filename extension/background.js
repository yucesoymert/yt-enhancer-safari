// Content scripts can't open the options page or talk to the native side themselves.
browser.runtime.onMessage.addListener(m => {
  if (m === 'options') browser.runtime.openOptionsPage();
  if (m?.covered) return browser.runtime.sendNativeMessage('application.id', m.covered); // Safari ignores the id
});

// main.js needs YouTube's page world for the player API. Safari ignores "world" in the manifest
// but supports it here (16.4+). Re-register on every start so an update never leaves a stale entry.
async function registerMain() {
  await browser.scripting.unregisterContentScripts({ ids: ['yte-main'] }).catch(() => {});
  await browser.scripting.registerContentScripts([{
    id: 'yte-main', matches: ['*://www.youtube.com/*'], js: ['lib.js', 'main.js'], world: 'MAIN', runAt: 'document_start',
  }]);
}
browser.runtime.onInstalled.addListener(registerMain);
browser.runtime.onStartup.addListener(registerMain);
