# Documentazione tecnica — Sentinel AI

Documento di riferimento sull'architettura e sulle scelte progettuali della piattaforma.

---

## 1. Struttura del file

L'applicazione è contenuta interamente in `index.html`, organizzato in tre blocchi:

| Blocco | Contenuto |
|---|---|
| `<style>` | Design system (variabili colore, tipografia), layout delle sezioni, componenti, media query |
| `<body>` | Navigazione, modale chiave API e le quattro sezioni: Home, Analisi, Impara, Chat |
| `<script>` | Gestione chiave, navigazione, motore di analisi, quiz, chat |

Le sezioni convivono tutte nel DOM e vengono mostrate o nascoste via classe CSS `.active`: è il modello di una single-page application, senza ricaricamento della pagina.

---

## 2. Design system

I colori sono definiti come variabili CSS in `:root`, così una modifica si propaga a tutta l'interfaccia:

```css
:root {
  --cyan: #00f5ff;    /* accento principale, elementi interattivi */
  --orange: #ff6b00;  /* accento secondario, etichette di sezione */
  --dark: #050a12;    /* sfondo */
  --green: #00ff88;   /* esito sicuro */
  --red: #ff3b3b;     /* esito pericoloso */
  --yellow: #ffd600;  /* esito da verificare */
}
```

Tre colori semantici — verde, giallo, rosso — sono riservati ai livelli di rischio e non usati altrove, perché il loro significato deve restare inequivocabile.

Tipografia: **Orbitron** per titoli e dati (carattere tecnico), **Inter** per il testo corrente (alta leggibilità a dimensioni piccole).

---

## 3. Gestione della chiave API

### Il problema
Un'applicazione interamente client-side che chiama un'API autenticata deve far arrivare una chiave al browser. Scriverla nel sorgente la renderebbe pubblica: chiunque potrebbe leggerla dal codice del repository o dagli strumenti per sviluppatori.

### La soluzione adottata
La chiave viene richiesta all'utente e conservata in `localStorage`:

```javascript
let API_KEY = localStorage.getItem('sentinel_api_key') || '';

function saveApiKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val.startsWith('sk-ant-')) { /* validazione formato */ }
  API_KEY = val;
  localStorage.setItem('sentinel_api_key', val);
}
```

`localStorage` è uno spazio di memoria del browser, isolato per dominio e per dispositivo. La chiave resta quindi sulla macchina di chi la inserisce e non entra mai nel repository.

### Limite noto
La chiave resta comunque visibile a chi ha accesso fisico a quel browser, e ogni utente deve procurarsene una. È il compromesso inevitabile di un'architettura senza backend. La soluzione definitiva è un server proxy che custodisca la chiave e inoltri le richieste — elencata tra gli sviluppi futuri.

---

## 4. Motore di analisi

### Flusso

```
testo utente
     │
     ├── chiave presente? ──no──► analyzeLocally()
     │                             (euristiche locali)
     ▼ sì
chiamata Claude API
     │
     ├── risposta valida ──► parsing JSON ──► showResult()
     └── errore/timeout ───► analyzeLocally() ──► showResult()
```

### Percorso AI
Il modello riceve un prompt di sistema che definisce i segnali da cercare (urgenza artificiale, link contraffatti, richieste di credenziali, promesse irrealistiche, pagamenti in gift card, impersonificazione) e impone un formato di risposta JSON rigido:

```json
{
  "livello": "SICURO|ATTENZIONE|PERICOLO",
  "titolo": "...",
  "spiegazione": "...",
  "indicatori": ["...", "...", "..."],
  "consiglio": "..."
}
```

Il formato vincolato serve a rendere la risposta processabile dall'interfaccia. Il parsing è difensivo: rimuove eventuali delimitatori markdown e, se il JSON risulta malformato, ricade sull'analisi locale invece di mostrare un errore.

### Percorso locale
`analyzeLocally()` conta le occorrenze di due liste lessicali:

- **Termini ad alto rischio** — "clicca", "password", "credenziali", "bloccato", "urgente", "vincita", "premio", "gift card", "entro 24"
- **Termini di contesto phishing** — "banca", "paypal", "poste", "account", "accedi", "login"

La classificazione è a soglia: due o più corrispondenze producono PERICOLO, una sola ATTENZIONE, nessuna SICURO.

È un metodo dichiaratamente semplice, con i limiti tipici dell'approccio lessicale: non coglie il contesto e può produrre falsi positivi. Il suo scopo non è sostituire il modello ma garantire che lo strumento resti utilizzabile quando l'API non è raggiungibile.

---

## 5. Chat

La conversazione mantiene lo storico in un array `chatHistory` inviato a ogni richiesta, perché l'API è stateless: senza storico il modello non ricorderebbe i turni precedenti.

```javascript
chatHistory.push({ role: 'user', content: text });
// ... chiamata API con messages: chatHistory
chatHistory.push({ role: 'assistant', content: reply });
```

Il prompt di sistema definisce pubblico (ragazzi dai 14 anni che partono da zero), ambito (sicurezza digitale), stile (spiegare ogni termine tecnico, esempi di vita quotidiana, massimo 180 parole) e gestione dei casi delicati (empatia prima delle istruzioni, riferimento a Telefono Azzurro e Polizia Postale).

Il fallback `getLocalReply()` copre sia gli argomenti principali sia le formule di conversazione (saluti, ringraziamenti, domande sull'assistente), perché una risposta fredda a un semplice "ciao" comprometterebbe la percezione dello strumento.

---

## 6. Quiz

Sessanta domande organizzate in sei percorsi tematici da dieci ciascuno, più un percorso misto generato estraendo dieci domande a caso dall'intero insieme.

```javascript
QUIZ = {
  phishing: { nome, icona, domande: [ { q, options, correct, spiega } × 10 ] },
  password: { ... }, cyberbullismo: { ... }, truffe: { ... },
  privacy: { ... }, malware: { ... }
}
```

Lo stato vive in `quizState = { current, score, domande, titolo }`. L'array `domande` viene mescolato con Fisher-Yates a ogni avvio, così la sequenza non si ripete identica: ripetere un quiz è un esercizio diverso, non un test di memoria sull'ordine.

Scelta didattica: dopo ogni risposta viene mostrata la spiegazione del ragionamento corretto, prima di passare alla successiva. Il feedback immediato e contestuale è più efficace del punteggio finale isolato.

---

## 7. Accessibilità e responsività

- Layout in flexbox e grid, adattivo senza breakpoint rigidi
- Media query dedicata sotto i 600px per la barra delle statistiche e la navigazione
- Contrasto testo/sfondo conforme ai livelli WCAG AA sui contenuti principali
- Nessuna informazione veicolata dal solo colore: ogni livello di rischio ha etichetta testuale e icona

---

## 8. Backend proxy

### Il problema dell'architettura client-side

Un'applicazione che gira interamente nel browser e chiama un'API autenticata deve in qualche modo far arrivare una chiave al client. Scriverla nel sorgente la rende pubblica; chiederla all'utente funziona ma pretende che ogni utente ne possieda una, il che è irrealistico per lo scopo dello strumento.

### La soluzione

Un Worker su Cloudflare fa da intermediario. Il browser invia la richiesta al Worker, il Worker la inoltra all'API di Anthropic aggiungendo la chiave, conservata come variabile d'ambiente lato server.

```
browser → Cloudflare Worker → API Anthropic
          (custodisce la chiave)
```

La chiave non compare mai nel codice pubblico né nel traffico verso il browser. Il repository può restare pubblico senza rischi.

### Limiti applicati dal Worker

Un proxy aperto è esposto ad abusi: chiunque conosca l'indirizzo può inoltrare richieste a spese di chi lo gestisce. Il Worker applica quindi due vincoli:

```javascript
const MAX_CARATTERI = 4000;   // per singolo messaggio
const MAX_TURNI = 20;         // profondità della conversazione
```

I prompt di sistema risiedono anch'essi sul Worker, non nel client: fanno parte del contratto del servizio e non sono modificabili da chi usa la pagina.

### Catena di fallback

L'applicazione tenta le tre modalità in ordine:

1. **Backend** — se `BACKEND_URL` è configurato
2. **Chiave personale** — se l'utente ne ha inserita una nel browser
3. **Motore locale** — sempre disponibile

Ogni passaggio fallito porta al successivo senza mostrare errori. Un backend irraggiungibile o in errore non produce un messaggio di guasto: produce una risposta dal motore locale. Per uno strumento di sicurezza la continuità di servizio è parte del requisito, non un dettaglio.

---

## 9. Sicurezza e privacy

| Aspetto | Implementazione |
|---|---|
| Dati personali | Nessuna raccolta, nessun cookie, nessun tracciamento |
| Messaggi analizzati | Mai persistiti, né localmente né su server |
| Trasmissione | HTTPS diretto browser → Anthropic, nessun intermediario |
| Chiave API | Solo `localStorage`, mai nel sorgente né nel repository |
| Input utente | Neutralizzato prima della visualizzazione (vedi sotto) |

### Protezione contro XSS

L'applicazione riceve testo arbitrario dall'utente — un messaggio sospetto da analizzare, una domanda in chat — e lo mostra a schermo. Inserire quel testo direttamente nel DOM tramite `innerHTML` avrebbe aperto una vulnerabilità **Cross-Site Scripting**: un messaggio contenente `<img src=x onerror="...">` avrebbe eseguito codice nel browser di chi lo incolla.

È un rischio particolarmente rilevante qui, perché lo strumento invita esplicitamente a incollare messaggi di provenienza sconosciuta.

La soluzione adottata è la sanificazione dell'input prima della visualizzazione:

```javascript
function testoSicuro(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

La funzione è applicata a: messaggi dell'utente in chat, tutti i campi del risultato di analisi (inclusi quelli provenienti dall'API, che non è una fonte fidata per definizione) e i contenuti del quiz.

I messaggi generati dall'assistente non vengono sanificati perché contengono formattazione voluta — grassetti, elenchi, interruzioni di riga — e provengono da contenuti interni all'applicazione.

### Robustezza

`localStorage` può non essere disponibile (navigazione privata, cookie di terze parti bloccati, restrizioni aziendali). Gli accessi sono incapsulati in `try/catch`: in caso di errore l'applicazione continua a funzionare in modalità locale invece di bloccarsi al caricamento.

---

## 10. Collaudo

L'applicazione è stata verificata con test automatizzati su browser reale (Chromium headless), su tre risoluzioni: 1440px, 768px e 390px.

| Area | Casi | Esito |
|---|---|---|
| Accuratezza dell'analisi | 37 messaggi (truffe reali e messaggi legittimi) | 37/37 |
| Smistamento degli argomenti in chat | 26 domande sui 21 temi | 26/26 |
| Comprensione conversazionale | 30 domande realistiche con seguiti | 29/30 |
| Riconoscimento con refusi | 25 varianti errate | 25/25 |
| Vulnerabilità XSS | 6 vettori d'attacco | 0 sfruttabili |
| Catena di fallback | backend spento, in errore, assente | 0 errori mostrati |
| Navigazione e interfaccia | 3 risoluzioni, tutti i componenti | 0 errori |

Il criterio adottato per l'analisi è la **prudenza asimmetrica**: un falso positivo (segnalare come sospetto un messaggio legittimo) costa all'utente una verifica in più; un falso negativo (dichiarare sicuro un messaggio fraudolento) può costargli l'account o il denaro. Le soglie sono quindi tarate per non lasciar passare le minacce, verificando allo stesso tempo che i messaggi ordinari non generino allarmi.

---

## 11. Limiti attuali

Dichiarati esplicitamente, perché riconoscerli fa parte della valutazione di uno strumento di sicurezza:

1. **Assenza di autenticazione sul backend** — il proxy applica limiti di dimensione ma non identifica chi chiama; un sistema di produzione richiederebbe token o limiti per indirizzo
2. **Analisi locale superficiale** — basata su parole chiave, priva di comprensione semantica
3. **Nessuna verifica degli URL** — i link non vengono controllati contro database di domini malevoli
4. **Solo testo** — non analizza immagini, screenshot o allegati
5. **Nessuna validazione sul campo** — i contenuti didattici non sono ancora stati testati con studenti reali

---

## 12. Riferimenti

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Polizia Postale — segnalazioni](https://www.commissariatodips.it)
- [Telefono Azzurro](https://azzurro.it) — 19696
- [Garante Privacy — sezione giovani](https://www.garanteprivacy.it)

---

*Ultimo aggiornamento: settembre 2026*
