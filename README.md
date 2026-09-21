# 🛡️ Sentinel AI

**Difesa digitale per chi non è un esperto.**

Sentinel AI è una piattaforma web che aiuta studenti e persone senza competenze tecniche a riconoscere le minacce digitali — phishing, truffe online, cyberbullismo — e a costruirsi una consapevolezza di base sulla sicurezza informatica.

🔗 **Prova la demo:** [lixusranger-alt.github.io/SentinelAI](https://lixusranger-alt.github.io/SentinelAI/)

> Progetto sviluppato per il **Premio GFMarilli 2026 — IX Edizione**, HackersGen / SORINT.lab
> Categoria III-IV Superiore · ITIS Ponti, Gallarate (VA)

---

## Il problema

Gli adolescenti sono tra i gruppi più esposti alle truffe digitali, eppure quasi nessuno ha mai ricevuto una formazione strutturata su come riconoscerle.

La maggior parte degli strumenti di cybersecurity esistenti ha tre limiti che li rendono inutilizzabili per questo pubblico:

- sono **in inglese**
- sono **tecnici**, scritti da esperti per esperti
- sono **pensati per aziende**, non per persone

Il risultato è che chi avrebbe più bisogno di questi strumenti è chi meno riesce a usarli.

## L'approccio

Sentinel AI parte da un'idea diversa: non basta *bloccare* una minaccia, bisogna far capire **perché** è una minaccia. Uno strumento che dice solo "pericolo" non insegna niente; uno che spiega cosa ha notato e perché conta costruisce una competenza che resta.

Da qui le tre funzioni della piattaforma, pensate come un percorso:

| | Funzione | Cosa fa |
|---|---|---|
| 🔍 | **Analisi** | Incolli un messaggio sospetto, ricevi una valutazione del rischio con i segnali specifici trovati e cosa fare |
| 📚 | **Impara** | Sei guide dai concetti base alle minacce specifiche, più un quiz di 60 domande diviso per argomento |
| 💬 | **Chat** | Un assistente conversazionale che risponde a domande libere sulla sicurezza digitale, tarato su un pubblico che parte da zero. Copre 21 argomenti anche senza connessione all'AI |

---

## Funzionalità

### Analisi dei messaggi
Riconosce i pattern ricorrenti delle truffe: urgenza artificiale, link abbreviati o contraffatti, richieste di credenziali, promesse irrealistiche, richieste di pagamento in gift card o criptovalute, impersonificazione di enti noti.

L'esito è classificato su tre livelli — **SICURO / ATTENZIONE / PERICOLO** — accompagnato dalla spiegazione dei segnali rilevati e da un'indicazione pratica.

Sono inclusi quattro messaggi di esempio (email bancaria falsa, SMS di vincita, richiesta urgente, messaggio legittimo) per permettere di provare lo strumento senza avere un caso reale a portata di mano.

### Percorso didattico
Sei guide, ordinate per costruire le fondamenta prima dei casi specifici:

1. **Cos'è la Cybersecurity** — la triade riservatezza/integrità/disponibilità, spiegata senza gergo
2. **Cos'è l'Intelligenza Artificiale** — come funziona un modello linguistico e perché è utile qui
3. **Phishing** — meccanismo, segnali, difese
4. **Truffe Online** — tipologie e leve psicologiche sfruttate
5. **Cyberbullismo** — riconoscerlo, documentarlo, a chi rivolgersi
6. **Password Sicure** — costruzione, gestione, autenticazione a due fattori

Ogni guida distingue i **segnali d'allarme** dalle **contromisure**, per rendere la lettura operativa e non solo informativa.

### Quiz di autovalutazione
**Sessanta domande** distribuite su sei percorsi tematici — phishing, password, cyberbullismo, truffe online, privacy, virus e malware — da dieci domande ciascuno, più un quiz misto che ne estrae dieci a caso da tutti i temi.

Le domande sono costruite su casi italiani reali: la truffa del pacco in giacenza, il finto compratore su Vinted, il messaggio "sono mamma, ho cambiato numero", i diritti previsti dalla Legge 71/2017.

L'ordine delle domande cambia a ogni avvio, così ripetere il quiz non significa rivedere la stessa sequenza. Dopo ogni risposta viene mostrata la spiegazione del ragionamento corretto: l'obiettivo non è il punteggio ma il feedback, perché capire *perché* una scelta è sbagliata è più formativo che sapere di aver sbagliato.

### Chat
Assistente conversazionale focalizzato sulla sicurezza digitale, istruito per spiegare ogni termine tecnico che introduce e usare esempi presi dalla vita quotidiana di uno studente.

Riconosce **cosa** viene chiesto, non solo l'argomento: una domanda su cos'è una cosa riceve una definizione, una su come difendersi riceve i passi pratici, una richiesta di esempi riceve casi concreti. Mantiene il filo del discorso, così i seguiti come "fammi degli esempi" o "come lo riconosco?" vengono risolti sull'argomento in corso.

Il riconoscimento tollera gli errori di battitura tramite normalizzazione fonetica e distanza di Levenshtein: *fishing*, *cyber secure*, *pasword* e *cyberbulismo* vengono ricondotti all'argomento giusto.

In modalità locale copre **21 argomenti**: cybersecurity, phishing, truffe online, acquisti online, ingegneria sociale, furto di identità, password, autenticazione a due fattori, crittografia, privacy, reputazione online, fake news e deepfake, virus e malware, backup, sicurezza dei dispositivi, reti Wi-Fi e VPN, sicurezza nei videogiochi, bullismo, cyberbullismo, adescamento online, benessere digitale.

---

## Architettura

```
┌───────────────────────────────────────────────┐
│                  index.html                   │
│         (HTML + CSS + JS, single file)        │
└───────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│   Backend    │ │  Chiave   │ │   Motore     │
│  Cloudflare  │ │ personale │ │   locale     │
│    Worker    │ │  browser  │ │  euristiche  │
│      ↓       │ │     ↓     │ │  + 21 temi   │
│  Claude API  │ │ Claude API│ │              │
└──────────────┘ └───────────┘ └──────────────┘
      1° scelta      2° scelta     rete di sicurezza
```

### Perché una single-page application senza framework

La scelta di scrivere tutto in un unico file HTML con JavaScript nativo, senza React, Vue o build step, è deliberata:

- **Zero installazione** — si apre in qualunque browser, anche da telefono
- **Zero dipendenze** — nessun `npm install`, nessuna versione che si rompe nel tempo
- **Ispezionabile** — chiunque può leggere il codice sorgente per intero
- **Distribuibile ovunque** — funziona anche aperto da file locale, senza server

Per uno strumento che deve raggiungere persone non tecniche, l'attrito di installazione è esso stesso una barriera da eliminare.

### Il doppio motore

L'applicazione funziona in due modalità:

**Con chiave API configurata** — le analisi e la chat sono gestite da Claude (modello `claude-sonnet-4-6`), con risposte libere e contestuali.

**Senza chiave API** — entra in funzione un motore locale basato su euristiche: riconoscimento di pattern lessicali per l'analisi dei messaggi e risposte strutturate per argomento nella chat.

Questa ridondanza non è un ripiego ma un requisito: uno strumento di sicurezza che smette di funzionare quando un servizio esterno è irraggiungibile è uno strumento inaffidabile. In modalità locale la piattaforma resta completamente utilizzabile — tutte le guide, il quiz e un'analisi di base restano disponibili.

### Gestione della chiave API

La chiave non è mai scritta nel codice sorgente. Viene inserita dall'utente tramite un pannello dedicato e conservata esclusivamente nel `localStorage` del browser, quindi mai trasmessa a server di terze parti né esposta nel repository pubblico.

Questa è la soluzione corretta per un'applicazione interamente client-side. In una versione di produzione, il passo successivo sarebbe un backend che faccia da proxy alle chiamate API, eliminando del tutto la necessità che l'utente gestisca una chiave.

---

## Tecnologie

| Ambito | Tecnologia |
|---|---|
| Struttura | HTML5 |
| Stile | CSS3 — custom properties, grid, flexbox, animazioni |
| Logica | JavaScript ES6+ (vanilla, nessun framework) |
| Intelligenza artificiale | Claude API — Anthropic, modello `claude-sonnet-4-6` |
| Persistenza locale | Web Storage API (`localStorage`) |
| Tipografia | Google Fonts — Orbitron, Inter |
| Backend | Cloudflare Workers (proxy per l'API) |
| Hosting | GitHub Pages |

---

## Utilizzo

**Online:** apri [lixusranger-alt.github.io/SentinelAI](https://lixusranger-alt.github.io/SentinelAI/)

**In locale:**
```bash
git clone https://github.com/lixusranger-alt/SentinelAI.git
cd SentinelAI
```
Apri `index.html` con un browser. Non serve altro.

**Per attivare l'AI completa:** crea una chiave su [console.anthropic.com](https://console.anthropic.com) e inseriscila nel pannello che appare al primo avvio. Senza chiave, la piattaforma resta pienamente utilizzabile in modalità locale.

---

## Sviluppi futuri

- **Estensione browser** per l'analisi dei link durante la navigazione
- **Modalità docente** con statistiche aggregate e anonime sulle minacce più segnalate in una classe
- **Espansione del percorso didattico** con moduli su deepfake, sicurezza dei dispositivi IoT e impronta digitale
- **Test sul campo** con studenti reali per validare la comprensibilità dei contenuti

---

## Privacy

L'applicazione non raccoglie, memorizza né trasmette dati personali. I messaggi analizzati non vengono salvati in alcun punto. Quando è configurata una chiave API, il testo viene inviato direttamente da browser ad Anthropic tramite HTTPS, senza server intermedi.

---

## Licenza

MIT — vedi [LICENSE](LICENSE).

---

*Sentinel AI — perché la sicurezza digitale non dovrebbe essere un privilegio per esperti.*
