# Rilascio sul Play Store · requisiti e guida per il PO

Voce: PO-144 · Decisioni: D-212, D-214 · Preparato da S-21 · Pagine lette il **2026-10-20** con `curl` (HTTP 200, versione inglese `?hl=en`).
Le citazioni sono testuali. Le regole di Google cambiano: prima di ogni passo rileggi la pagina indicata.

Legenda dello stato: **fatto** · **da fare dal PO** · **da fare da noi** (sessioni) · **decisione PO**.

## 1. Requisiti

| # | Requisito | Fonte ufficiale (letta il 2026-10-20) | Cosa dice | Stato per Vandel Falls |
|---|---|---|---|---|
| 1 | Account sviluppatore | https://support.google.com/googleplay/android-developer/answer/6112435 · https://support.google.com/googleplay/android-developer/answer/13628312 | «There is a US$25 one-time registration fee»; «You must be at least 18 years of age»; account «Personal» o «Organization»; l'account personale chiede nome e indirizzo legali, documento e verifica di un dispositivo Android con l'app Play Console. | **da fare dal PO** (Non posso confermare se esiste già un account) |
| 2 | Test chiuso prima della produzione (account personali) | https://support.google.com/googleplay/android-developer/answer/14151465 | «Developers with personal accounts created after November 13, 2023, must run a closed test for their app with a minimum of 12 testers who have been opted in continuously for at least 14 days.» «Open testing becomes available after you gain production access.» | **da fare dal PO**: 12 tester per 14 giorni consecutivi, poi richiesta di accesso alla produzione dalla Dashboard |
| 3 | Target API level | https://developer.android.com/google/play/requirements/target-sdk · https://support.google.com/googleplay/android-developer/answer/11926878 | «Starting August 31, 2026: New apps and app updates must target Android 16 (API level 36) or higher». Proroga su richiesta fino al 1/11/2026. | **fatto**: `targetSdkVersion = 36` (android/variables.gradle:4) |
| 4 | Formato AAB | https://developer.android.com/guide/app-bundle | «From August 2021, new apps are required to publish with the Android App Bundle on Google Play.» | **fatto da noi**: job CI «aab» (.github/workflows/catene.yml:120), AAB non firmato di controllo, `bundleRelease` |
| 5 | Play App Signing e chiave di caricamento | https://developer.android.com/studio/publish/app-signing · https://support.google.com/googleplay/android-developer/answer/9842756 | «Play App Signing is required to sign your app for distribution through Google Play»; «Your key should be valid for at least 25 years»; «your upload key and app signing key should be different»; chiave persa: «Request upload key reset». | Chiave di caricamento e firma in Android Studio: **da fare dal PO** (§2.2, D-214). Nessuna firma nel repository |
| 6 | Classificazione dei contenuti (IARC) | https://support.google.com/googleplay/android-developer/answer/9898843 | «All apps must have a content rating from the IARC to be on Google Play.» «Apps without a content rating will be removed». Va rifatto se il contenuto cambia. | **da fare dal PO** (§2.5). Il rating lo decide solo il questionario (CLAUDE.md) |
| 7 | Sicurezza dei dati | https://support.google.com/googleplay/android-developer/answer/10787469 | «All developers … must complete the Data safety form, including apps on closed, open, or production testing tracks.» «Even developers with apps that do not collect any user data must complete this form and provide a link to their privacy policy.» | **da fare dal PO** (§2.5); risposte suggerite in §3 |
| 8 | Privacy policy | https://support.google.com/googleplay/android-developer/answer/10144311 | «All apps must post a privacy policy link in the designated field within Play Console, and a privacy policy link or text within the app itself.» «Apps that do not access any personal and sensitive user data must still submit a privacy policy.» URL pubblico, «no PDFs». | **fatto da noi** (D-217, D-220, D-222; S-22): nel gioco, voce «Privacy» nel menu «Altro» della home (src/resa/schermate/Titolo.tsx:31-32); pagina pubblica https://antoniovairo-rgb.github.io/valmora/privacy (verificata il 2026-10-21 con `curl`: 301 verso `…/privacy/`, poi 200, titolo «Privacy – Varcalda»). Testo unico in data/testi/it/privacy.json. Nella Play Console l'URL da incollare: **da fare dal PO** |
| 9 | Scheda dello store | https://support.google.com/googleplay/android-developer/answer/9866151 | Icona «512px by 512px», «32-bit PNG (with alpha)», max 1024 KB; grafica in evidenza «1024px by 500px», «JPEG or 24-bit PNG (no alpha)»; «a minimum of two screenshots», lato tra 320 e 3840 px; per i giochi consigliati «three 9:16 portrait screenshots (minimum 1080x1920px)». | Immagini e testi: **fatto da noi** (S-23, §5): `store/it-IT/`, generati da `node tools/store/immagini.mjs`, misurati dal passo «store» della catena. Caricamento nella Play Console: **da fare dal PO** |
| 10 | Pubblico destinatario e contenuti | https://support.google.com/googleplay/android-developer/answer/9867159 | «you'll be required to declare your app's target age group. Any apps that include children in their target audience must comply with Google Play's Families Policy Requirements». Prima servono dichiarazione pubblicità e privacy policy. | **decisione PO**: fascia d'età (se include minori si applica la politica Famiglie); opzioni in coordination/handoffs/sviluppatrice/S-23-store.md |
| 11 | Pubblicità | https://support.google.com/googleplay/android-developer/answer/9859455 | «You must declare whether or not your app contains ads.» | **da fare dal PO**: risposta «No» (verifica in §3: nessun SDK pubblicitario in package.json:26-38) |
| 12 | versionCode crescente | https://developer.android.com/studio/publish/versioning | «each successive release of your app uses a greater value»; «The greatest value Google Play allows for versionCode is 2100000000.» | **fatto da noi**: regola in android/app/build.gradle:4-12, guardiano tools/aab.mjs e tests/aab.test.ts |

### Regola della versione (D-212)

`versionCode = maggiore × 1 000 000 + minore × 1 000 + correzione` (ognuno 0-999), `versionName = GAME_VERSION`.
0.46.0 → 46000 · 0.47.0 → 47000 · 1.0.0 → 1000000. **Versione corrente: 0.59.0 → versionCode 59000** (src/versione.ts, letta il 2026-10-27). Cresce sempre se GAME_VERSION cresce; il massimo (999.999.999 → 999999999) resta sotto 2100000000.
Vale solo per il rilascio: l'APK di debug del job «apk» resta `versionCode 1`, `versionName "1.0"` (android/app/build.gradle:41-48).

## 2. Guida passo passo per il PO

### 2.1 Firma: come funziona (Play App Signing)

Fonti: https://support.google.com/googleplay/android-developer/answer/9842756 e https://developer.android.com/studio/publish/app-signing, lette il 2026-10-20.
- Con Play App Signing «Google manages and protects your app's signing key».
- Tu firmi ogni AAB solo con la tua **chiave di caricamento**; Google rifirma l'app per gli utenti.
- «When you use Play App Signing, if you lose your upload key, or if it is compromised, you can request an upload key reset in the Play Console» (Play Console, sezione «Upload key certificate» → «Request upload key reset»).
- Se perdi la chiave di caricamento non perdi l'app, ma non puoi caricare nuove versioni finché Google non accetta la chiave nuova. Quanto tempo ci vuole: **Non posso confermarlo**, la pagina non lo indica.
- «For maximum security, your upload key and app signing key should be different» (answer 9842756).

### 2.2 Strada scelta (D-214): firma in locale con Android Studio

**Requisiti** (verificati sulle pagine ufficiali il 2026-10-20)
- **Android Studio**: l'ultima stabile sulla pagina di download è «Android Studio Rabbit 1 | 2026.2.1» (https://developer.android.com/studio/releases). Il gioco usa Capacitor 8 (package.json:27-28), e la documentazione di Capacitor dice «Capacitor 8 requires a minimum of Android Studio 2025.2.1» (https://capacitorjs.com/docs/getting-started/environment-setup).
- **JDK**: è già incluso in Android Studio. «The JetBrains Runtime (JBR) is an enhanced JDK, distributed with Android Studio» (https://developer.android.com/build/jdks); «You do not need to separately install the Java Development Kit (JDK)» (stessa pagina di Capacitor).
- **Computer**, requisiti minimi: Windows 10 a 64 bit oppure macOS 12; 8 GB di RAM; 8 GB di disco libero per Studio (https://developer.android.com/studio/install).
- **Node.js** `>=22.18` (package.json, `engines`) e **Git**. La versione minima di Git: **Non posso confermarlo**.

**Comandi nella cartella locale** (una volta sola: `git clone https://github.com/antoniovairo-rgb/valmora.git`, poi `cd valmora`):

```
git pull
npm ci
npx vite build
npx cap sync android
```

Li ho verificati il 2026-10-20 in una cartella pulita, appena clonata da `claude/valmora-aab` (c4d2243), con Node 22.22.0 e npm 10.9.4: esito 0 in 7,9 s.
- `vite build` → «✓ built in 1.39s», con l'avviso sui blocchi oltre 500 kB, che non blocca la build.
- `cap sync android` → «Copying web assets from dist to android/app/src/main/assets/public … Sync finished».
- Dopo i comandi `git status` è vuoto: la cartella resta pulita per il prossimo `git pull`.

`npm ci` installa esattamente le versioni di package-lock.json. In questa prova girava su Linux. Su Windows e macOS: IPOTESI, stessa sequenza, **non verificato**.

**Passi in Android Studio** (https://developer.android.com/studio/publish/app-signing)
1. **Open** → cartella `valmora/android`. Al primo avvio Studio scarica l'SDK che manca. Per Capacitor, i componenti si installano da **Tools → SDK Manager**.
2. **Build → Generate Signed Bundle/APK** → **Android App Bundle** → **Next** → modulo `app`.
3. Solo la prima volta crei la chiave: sotto «Key store path» premi **Create new** e compila:
   - **Key store path**: un percorso **fuori** dalla cartella `valmora`, per esempio Documenti, con il file `valmora-upload.jks`. Il repository esclude comunque `*.jks` (.gitignore:5).
   - **Password** e **Key alias** (es. `valmora-upload`), poi la password della chiave. Google: «This should be the same as your keystore password».
   - **Validity (years)**: almeno 25 («Your key should be valid for at least 25 years»).
   - **Certificate**: nome e paese. Google: «This information is not displayed in your app».
   - **Da annotare** in un gestore di password: percorso del file, alias e password. Fai una copia di riserva del `.jks` fuori dal computer. Non mandarla in chat e non metterla in git.
4. Dalla seconda volta selezioni il keystore esistente e inserisci alias e password → **Next** → cartella di destinazione, tipo di build **release** → **Create**.
5. A fine build Studio mostra un avviso con il link per trovare l'AAB. La cartella predefinita: **Non posso confermarlo**, la pagina dice solo «select a destination folder». Il file si chiama di norma `app-release.aab`.
6. Caricalo nel test chiuso (§2.4).

**Allineamento di versionCode e versionName.** Studio esegue la stessa build Gradle della CI. I due valori arrivano da `src/versione.ts` della tua cartella: regola in android/app/build.gradle:3-13, applicata solo alla build release in :41-48. Quindi l'AAB porta la GAME_VERSION del commit su cui sei: 0.46.0 → versionCode 46000. Due regole:
- Fai sempre `git pull` e i comandi sopra prima di costruire.
- Non caricare due volte la stessa GAME_VERSION. Google la rifiuta: «You can't upload … with a versionCode you have already used» (https://developer.android.com/studio/publish/versioning).

Il job CI «aab» (.github/workflows/catene.yml) costruisce lo stesso AAB **non firmato**. Serve solo a controllare che la build riesca e che il manifest abbia versione e permessi giusti (tools/aab.mjs). Non è da caricare.

### 2.3 Alternative (non scelte, per riferimento)

- **jarsigner da riga di comando**: crea la chiave con `keytool -genkey -v -keystore valmora-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias valmora-upload`, poi firma un AAB non firmato con `jarsigner -keystore valmora-upload.jks app-release.aab valmora-upload`. Fonte: https://developer.android.com/build/building-cmdline, che avverte anche «You cannot use apksigner to sign your app bundle».
- **Segreti di GitHub, firma in CI**: la chiave starebbe anche nei segreti del repository. Non implementata (D-214).
- **Chiave generata da un job CI e scaricata**: per tutta la vita dell'artifact la chiave privata starebbe sui server di GitHub. Non implementata, sconsigliata.

### 2.4 Creare il test chiuso

Fonte: https://support.google.com/googleplay/android-developer/answer/9845334 (letta il 2026-10-20).
1. Play Console → crea l'app: nome, lingua predefinita italiano, «Gioco», «Gratuita».
2. **Test and release → Testing → Closed testing** → **Manage track** → scheda **Testers** → **Create email list**, oppure un Google Group, con almeno 12 tester.
3. Indica un indirizzo o un URL per i commenti, poi **Create a release** e carica `app-release.aab`. Al primo caricamento accetti Play App Signing.
4. **Share your app with testers**: copia il link di adesione. Compare solo quando lo stato dell'app è «Published».
5. I 12 tester devono restare iscritti **14 giorni consecutivi**. Poi chiedi l'accesso alla produzione dalla Dashboard (answer 14151465).

Attenzione (answer 9845334): chi è iscritto al test interno non riceve il test chiuso.

### 2.5 Compilare IARC, sicurezza dei dati, pubblico e scheda

- **App content → Content rating**: questionario IARC. Rispondi in base ai contenuti reali: la violenza è solo raccontata in rapporti, radio e verbali (docs/BIBBIA.md). Vale il risultato del questionario.
- **App content → Ads**: «No».
- **App content → Data safety**: vedi §3.
- **App content → Privacy policy**: l'URL pubblico della pagina (§4).
- **App content → Target audience and content**: la fascia d'età la decidi tu.
- **Store listing**:
  - nome, descrizione breve e descrizione completa;
  - icona 512×512 e grafica 1024×500;
  - almeno 2 screenshot (consigliati 3 verticali 1080×1920).

## 3. Verifica sul codice: dati, rete, permessi

Comandi eseguiti il 2026-10-20 sul commit di questo documento:

- `grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|analytics|gtag|firebase|navigator\.geolocation" src` → **nessun risultato** nel codice del gioco.
- Salvataggio solo nel telefono: `localStorage` in src/resa/archivio.ts:52-77.
- `public/sw.js:20,35`: `fetch` del service worker della **versione web** (cache per l'uso offline del sito); nell'app Android il gioco è servito dai file locali di Capacitor. IPOTESI non misurata sul telefono.
- Dipendenze (package.json:26-38): Capacitor, React, PixiJS, Motion, Lucide, Ajv, caratteri Fontsource. **Nessun SDK di analisi, pubblicità o crash report**.
- Collegamenti esterni aperti solo su azione del giocatore: condivisione del verbale (Web Share / appunti, src/resa/collegamenti.ts:12-17), email «Idee» (`mailto:`, src/resa/collegamenti.ts:26-27, src/resa/schermate/Titolo.tsx:34). «Sostieni» è nascosto nell'app Android (src/resa/schermate/Titolo.tsx:32, `!Capacitor.isNativePlatform()`).
- Permessi nel manifest: solo `android.permission.INTERNET` (android/app/src/main/AndroidManifest.xml:40, messo dal modello di Capacitor). Non serve ai file locali del gioco (IPOTESI, non misurata su telefono): toglierlo è una **decisione** (opzioni nel rapporto S-21). Il guardiano tools/aab.mjs lo segnala e boccia qualunque altro permesso nel manifest finale dell'AAB.
- `android:allowBackup="true"` (AndroidManifest.xml:5): il salvataggio può finire nel backup Google del telefono dell'utente. Se questo conti come «raccolta» ai fini del modulo: **Non posso confermarlo**; leggere la parte sulla raccolta dei dati di answer 10787469 prima di rispondere.

### 3.1 Risposte suggerite per Data safety (S-23, pagina 10787469 riletta il 2026-10-21)

Definizioni della pagina: «"Collect" means transmitting data from your app off a user's device»; non va dichiarato come raccolto ciò che è «only processed locally on the user's device and not sent off device»; non è «sharing» il trasferimento «based on a specific user-initiated action, where the user reasonably expects the data to be shared».

| Domanda del modulo | Risposta suggerita | Su cosa si basa |
|---|---|---|
| «Does your app collect or share any of the required user data types?» | **No** | FATTO MISURATO (S-22, `node tools/misura-rete.mjs`): 0 richieste esterne su 3152 in una partita intera e01-e03 in Chromium; nessun SDK di analisi, pubblicità o crash report (package.json); salvataggio solo in `localStorage` |
| Condividi del verbale, email «Idee» | non sono «sharing» | partono solo dal tocco del giocatore (src/resa/collegamenti.ts:12-17, 26-27): eccezione «user-initiated action» citata sopra |
| Privacy policy | https://antoniovairo-rgb.github.io/vandelfalls/privacy (D-249: repository rinominato dal PO in «vandelfalls» il 2026-10-28; nel gioco l'indirizzo sta solo in src/resa/collegamenti.ts, URL_GIOCO) | D-217, D-220, D-222, D-244, D-249 |

Restano **Non posso confermarlo** (D-216):
- **telefono vero**: la misura delle richieste è in Chromium sulla build web, non nell'APK/AAB su un dispositivo Android;
- **allowBackup="true"** (AndroidManifest.xml:5): se il backup Android del salvataggio conti come «raccolta». La pagina parla di dati trasmessi «from your app off a user's device»; il backup lo fa il sistema, ma la pagina non lo nomina. Prima di rispondere «No», il PO rilegge la pagina; in dubbio si può chiedere all'assistenza Play.

## 4. Bozza di privacy policy (da pubblicare su un URL pubblico, non PDF)

> **Vandel Falls – Cortina di fumo · Informativa sulla privacy**
> Ultimo aggiornamento: [data di pubblicazione]
>
> Vandel Falls è un gioco che funziona offline. Il gioco non raccoglie, non trasmette e non condivide dati personali.
> - **Dati salvati**: i progressi della partita restano solo sul tuo dispositivo, nella memoria dell'app. Non vengono inviati a noi né a terzi. Disinstallando il gioco o cancellandone i dati vengono eliminati.
> - **Nessuna analisi, pubblicità o tracciamento**: il gioco non contiene strumenti di statistica, pubblicità o profilazione.
> - **Azioni che fai tu**: se scegli di condividere il verbale di una partita o di scriverci un'email, il testo passa all'app che scegli (per esempio la posta); i dati che invii così sono trattati da quell'app e, per le email, da noi solo per risponderti.
> - **Minori**: il gioco non raccoglie dati di nessun utente, minori compresi.
> - **Contatti**: [indirizzo email del PO].
> - **Modifiche**: eventuali modifiche saranno pubblicate in questa pagina con la nuova data.

Da completare dal PO: data, indirizzo di contatto, URL di pubblicazione. Il testo non è stato rivisto da un legale: **Non posso confermare** che basti per ogni legge applicabile.

## 5. Scheda dello store (S-23)

Cartella: `store/it-IT/`. Rigenerare: `npx vite build && node tools/store/immagini.mjs`. Misurare: `node tools/store/misure.mjs` (anche passo «store» della catena «governo», con bracci rossi).

| File | Cosa | Misura (2026-10-21, script) | Requisito (answer 9866151) |
|---|---|---|---|
| `icona.png` | icona 512, dalla sorgente tools/icona/icona.svg.mjs | PNG 512×512, 32 bit con alfa, 19 KB | 32-bit PNG con alfa, 512×512, ≤ 1024 KB |
| `grafica.jpg` | grafica in evidenza, logo e token del gioco | JPEG 1024×500, 24 bit, senza alfa, 57 KB | JPEG o PNG 24 bit senza alfa, 1024×500 |
| `schermata-1.jpg` … `-4.jpg` | home, città, una chiamata (e01), il verbale (e01) dal gioco vero, 360×640 × 3 | JPEG 1080×1920, 24 bit, senza alfa, 258-355 KB | per i giochi, consigliate tre 9:16 verticali da almeno 1080×1920 |
| `testi.json` | nome, descrizione breve, descrizione completa | 25 / 78 / 1231 caratteri | 30 / 80 / 4000 (answer 9859152 e 9866151) |

Il PO incolla i testi e carica le immagini nella pagina **Main store listing** della Play Console (nome da answer 9859152, letta il 2026-10-21). Il menu esatto che porta alla pagina: Non posso confermarlo, la pagina non lo elenca.
