# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile Robert Bosch din România.

Extrage anunțurile din API-ul public [SmartRecruiters](https://jobs.smartrecruiters.com/BoschGroup) (Bosch Group) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul Peviitor.

> **🌱 Scraper derivat.** Acest repo a fost derivat din [templateul EPAM](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper), implementarea de referință pentru scraper-ele Node.js din ecosistemul peviitor.ro.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul Robert Bosch (5541546) și verifică:
   - Denumirea oficială: ROBERT BOSCH SRL
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din API-ul public SmartRecruiters, filtrat pe România
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în Peviitor** — upsert prin API-ul Peviitor (job-uri și date companie)
6. **Generează jobs.md** — fișier markdown cu informații companie + toate job-urile curente

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| SmartRecruiters | `https://api.smartrecruiters.com/v1/companies/BoschGroup/postings` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |

## Robots.txt

SmartRecruiters [robots.txt](https://api.smartrecruiters.com/robots.txt) dezactivează `Disallow: /` pentru user-agent-ul generic (excepție doar pentru LinkedInBot pe `/v1/companies/`).

Scraper-ul folosește API-ul cu rate limiting (1s delay între pagini, 50 job-uri/cerere) și un singur User-Agent identificabil. Paginile individuale de job (`jobs.smartrecruiters.com`) nu au robots.txt — sunt doar verificate (HEAD request), nu parse-uite.

Pentru analiza completă, vezi [ai/ROBOTS.md](../ai/ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, Peviitor API conditional)
npm run test:integration

# Doar E2E (API real SmartRecruiters + ANAF + Peviitor)
npm run test:e2e
```

Testele Peviitor API folosesc `itIfApi` — se auto-skip dacă API-ul Peviitor nu e disponibil.
