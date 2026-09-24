# Robots.txt Analysis — SmartRecruiters (Bosch Group)

Sursa: https://api.smartrecruiters.com/robots.txt

## Reguli

```
User-agent: LinkedInBot
Allow: /v1/companies/
User-agent: *
Disallow: /
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (toate user-agent-urile, exceptând LinkedInBot) | ❌ Disallowed | Tot API-ul, inclusiv `/v1/companies/BoschGroup/postings` folosit de scraper |
| `/v1/companies/` | ✅ Allowed doar pentru `LinkedInBot` | Endpoint-ul de joburi |
| `jobs.smartrecruiters.com` (paginile individuale de job) | Fără robots.txt (404 la cerere) | Nu există restricții declarate |

## Diferență față de EPAM template

Identic cu EPAM: `Disallow: /` pentru user-agent-ul generic, API public care răspunde 200 OK fără autentificare la cereri normale. Singura diferență e excepția explicită pentru `LinkedInBot`, irelevantă pentru noi.

## Recomandare

robots.txt NU este legal binding, dar reprezintă intenția proprietarului site-ului.

- API-ul `/v1/companies/BoschGroup/postings` e **disallowed** de robots.txt pentru user-agent-uri generice. În practică, serverul răspunde cu 200 OK cu `User-Agent` normal și fără autentificare — este API-ul public folosit chiar de widget-ul oficial de cariere Bosch.
- Paginile individuale de job (`jobs.smartrecruiters.com`) nu au robots.txt — nu sunt scraper-uite direct, doar verificate (HEAD request) în teste.
- Scraper-ul face o cerere per pagină (50 job-uri) cu delay de 1s între pagini — comportament rezonabil, nu agresiv.

**Concluzie**: Risc minim. API-ul e public, răspunde fără autentificare, iar scraperul e politicos (rate limiting, User-Agent standard, o singură cerere simultană).
