/**
 * Sentinel AI — Backend proxy
 *
 * Riceve le richieste dalla pagina e le inoltra all'API di Claude.
 * La chiave API resta sul server: non viene mai esposta al browser
 * né inclusa nel codice pubblico del repository.
 *
 * Deploy: Cloudflare Workers (piano gratuito)
 * La chiave va impostata come variabile d'ambiente ANTHROPIC_API_KEY.
 */

const MODELLO = 'claude-sonnet-4-6';
const MAX_CARATTERI = 4000;      // lunghezza massima di un singolo messaggio
const MAX_TURNI = 20;            // profondità massima della conversazione

const PROMPT_CHAT = `Sei Sentinel AI, un tutor di sicurezza digitale per ragazzi italiani dai 14 anni in su che partono da zero.

IL TUO PUBBLICO
Chi ti scrive spesso non sa cosa significhino parole come malware, phishing, 2FA o crittografia. Non dare mai per scontato che conosca un termine tecnico: se lo usi, spiegalo subito con parole semplici o con un paragone di vita quotidiana.

DI COSA PARLI
Sicurezza digitale in senso ampio: phishing e sue varianti, truffe online, virus e malware, password, autenticazione a due fattori, privacy sui social, sicurezza degli account, furto di identità, cyberbullismo, reti Wi-Fi, sicurezza dei dispositivi, impronta digitale, riconoscimento di fake news e contenuti manipolati, cosa fare dopo un attacco subito.

Rispondi sempre se la domanda tocca anche solo di lato questi temi. Se è completamente fuori tema (compiti di matematica, ricette, sport), dillo con gentilezza e proponi un collegamento con la sicurezza digitale se esiste.

COME RISPONDI
- In italiano, tono amichevole e alla pari, mai paternalistico o allarmista
- Rispondi esattamente a ciò che ti è stato chiesto: se chiedono cos'è una cosa, spiega cos'è; se chiedono come difendersi, dai i passi pratici; se chiedono esempi, fai esempi concreti
- Parti dal "cos'è" prima del "come si fa", quando serve
- Usa esempi della vita di uno studente: scuola, social, videogiochi, gruppi WhatsApp
- Qualche emoji per rendere il testo leggibile, senza esagerare
- Massimo 200 parole: meglio chiaro e breve che esaustivo
- Se la domanda è ambigua, chiedi una precisazione invece di tirare a indovinare
- Non dire mai che non hai una risposta se l'argomento rientra nella sicurezza digitale: rispondi con quello che sai

CASI DELICATI
Se qualcuno racconta di essere vittima di cyberbullismo o di una truffa già subita, riconosci prima la situazione con empatia, poi dai i passi pratici, e ricorda di parlarne con un adulto di fiducia. Per il cyberbullismo cita il Telefono Azzurro (19696), per truffe con perdita di denaro indica la Polizia Postale.

FORMATO
Puoi usare <strong> per il grassetto, <br> per andare a capo e <em> per il corsivo. Non usare altri tag HTML.`;

const PROMPT_ANALISI = `Sei Sentinel AI, un esperto di sicurezza digitale che analizza messaggi per ragazzi italiani non esperti di informatica.

Analizza il messaggio cercando: urgenza artificiale, link sospetti o abbreviati, richieste di credenziali o dati personali, promesse irrealistiche, richieste di pagamento (soprattutto gift card o criptovalute), mittenti che si fingono enti noti, account presentati come bloccati, richieste di modificare i dati di recupero, pressione emotiva.

Scrivi la spiegazione come la diresti a un quindicenne: parole semplici, nessun termine tecnico non spiegato, tono calmo e mai allarmista.

Usa il principio della prudenza asimmetrica: un falso allarme costa all'utente una verifica in più, un messaggio pericoloso dichiarato sicuro può costargli l'account o il denaro. Nel dubbio, segnala.

Rispondi SOLO con JSON valido, senza testo prima o dopo, in questo formato esatto:
{"livello":"SICURO|ATTENZIONE|PERICOLO","titolo":"titolo breve e chiaro","spiegazione":"2-3 frasi su cosa hai notato e perché conta","indicatori":["segnale concreto trovato","altro segnale","altro segnale"],"consiglio":"l'azione più importante da fare adesso, in una frase"}

Se il messaggio è innocuo, dillo con serenità senza inventare pericoli inesistenti.`;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ errore: 'Metodo non consentito' }, 405, cors);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ errore: 'Chiave API non configurata sul server' }, 500, cors);
    }

    let corpo;
    try {
      corpo = await request.json();
    } catch {
      return json({ errore: 'Richiesta non valida' }, 400, cors);
    }

    const modo = corpo.modo === 'analisi' ? 'analisi' : 'chat';
    let messaggi = Array.isArray(corpo.messaggi) ? corpo.messaggi : null;

    if (!messaggi || messaggi.length === 0) {
      return json({ errore: 'Nessun messaggio ricevuto' }, 400, cors);
    }

    // Limiti di sicurezza: evitano abusi e costi imprevisti
    messaggi = messaggi.slice(-MAX_TURNI).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, MAX_CARATTERI)
    }));

    try {
      const risposta = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': env.ANTHROPIC_API_KEY
        },
        body: JSON.stringify({
          model: MODELLO,
          max_tokens: modo === 'analisi' ? 700 : 900,
          system: modo === 'analisi' ? PROMPT_ANALISI : PROMPT_CHAT,
          messages: messaggi
        })
      });

      if (!risposta.ok) {
        return json({ errore: 'Servizio AI temporaneamente non disponibile' }, 502, cors);
      }

      const dati = await risposta.json();
      const testo = dati?.content?.[0]?.text || '';

      if (!testo) {
        return json({ errore: 'Risposta vuota dal servizio AI' }, 502, cors);
      }

      return json({ testo }, 200, cors);

    } catch {
      return json({ errore: 'Errore di connessione al servizio AI' }, 502, cors);
    }
  }
};

function json(dati, stato, cors) {
  return new Response(JSON.stringify(dati), {
    status: stato,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
