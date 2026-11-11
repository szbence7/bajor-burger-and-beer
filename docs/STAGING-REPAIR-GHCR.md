# Staging hiba és GHCR átállás előkészítése — 2026-11-11

## Állapot

A staging helyreállt: a felhasználó által engedélyezett 0010 migráció sikeresen
alkalmazva, és a teljes élő böngészős ellenőrzés sikeres. A 0011 nem futott le.
Az eredeti `fa89620` alkalmazáskonténer újraindítás nélkül működik.

A diagnosztikai kód és GHCR workflow elkészült. Az első GitHub Actions futás
ellenőrzi és publikálja a staging image-et; a GHCR → Coolify automatikus bekötés
kikapcsolva marad. Coolify- és deploymentbeállítást nem módosítottunk.
Az új kód main-re pusholása a meglévő Coolify Git-deployt is elindíthatja;
az image-pullra átállás külön későbbi lépés.
A felhasználó a hozzáféréshez hozzáadta a megadott publikus kulcsot a root
SSH-belépéséhez; ezután a kapott hozzáféréssel hajtottuk végre az engedélyezett migrációt.

## Bizonyíték és kiváltó kódsor

A staging `/` HTTP 500 válaszának TanStack dehydrated route adata tartalmazta:

```json
{
  "code": "PGRST205",
  "details": null,
  "hint": null,
  "message": "Could not find the table 'public.menu_books' in the schema cache"
}
```

Ez közönséges PostgREST objektum, nincs eredeti `stack` vagy `cause` mezője.
A hibát nem a böngészőben kell keresni: a főoldal loaderének SSR futása már elbukik.
Az eredeti Node 22 Alpine konténer naplójában reprodukálhatóan csak az indulás látszik.
A root loader site adatai szerepelnek a staging HTML-ben; az admin belépő működik.

A `fa89620` commit az előző `4d877f3` állapothoz képest:

- `src/features/menu/api.ts`: a homepage loader új kötelező `getMenuBooks()` hívása;
- `src/server/menus.ts`: `.from("menu_books").select("*, menu_versions(*)")`, majd `if (error) throw error`;
- `supabase/migrations/0010_menu_books.sql`: az ehhez szükséges két új tábla, RLS és induló menük;
- a PDF végpont szintén az új táblákat kezdi használni (`src/server/content.ts`).

A bizonyított kiváltó ok a hiányzó **0010 adatbázis-migráció**. SSH-n közvetlenül
ellenőrizve: a migrációs történet 0009-ig tartott, és a `to_regclass` mindkét új
táblára NULL-t adott. Tehát nem csupán elavult schema cache-ről volt szó.
A hero, a dinamikusan importált PDF.js és a kliensoldali page-flip nem okozta ezt a hibát.

## Végrehajtott minimális helyreállítás

A staging adatbáziskonténer: `supabase-db-kovyuzuiqzx4podapqmbkf5c`, PostgreSQL 15.8.
A meglévő szerveroldali mentést ellenőriztük:
`/data/bajor-transfer-20261103/target-before.dump` (2026-11-03-i, nem friss mentés).
A teljes adatbázis helyi exportját az automatikus jóváhagyási ellenőrzés érzékeny
adatok másolása miatt elutasította; ilyen export nem történt.

A `scripts/staging-menu-migration.sql` wrapper a hozzá tartozó eredeti 0010 SQL-lel
kibontva, SSH stdin csatornán át, `docker exec -i ... psql -X -U postgres -d postgres
-v ON_ERROR_STOP=1 --single-transaction` paranccsal futott. Nem másoltunk adatbázisadatot
helyi gépre, és nem telepítettünk fájlt a szerverre.

A tranzakció ellenőrizte a 0009 előállapotot és a táblák hiányát, létrehozta az új
táblákat és RLS policykat, megőrizte a korábbi feltöltött PDF-et, ellenőrizte a
változatlan teljes `site_settings` tartalmat, rögzítette a 0010-et, és PostgREST
schema-cache reloadot jelzett. A 0011-et nem alkalmazta, nem futtatott resetet vagy
seed parancsot, és nem törölt meglévő adatot.

Ellenőrzött eredmény: **4 könyv, 6 nyelvi verzió**, a korábbi PDF **4 oldala** és
mind a **7 havi ajánlat** megmaradt. A migrációs történet utolsó eleme 0010;
a wrapper ismételt alkalmazását az előfeltétel-ellenőrzés megakadályozza.

A helyi `.env` localhost Supabase-ra mutat, nem a staging konfigurációja.
Az eredeti reprodukcióhoz a publikus admin server-function válaszból kinyert anon
konfiguráció privát ideiglenes fájlba került. Később az élő konténer runtime
változóit SSH-n is ellenőriztük, titkos értékek kiírása nélkül:

- NODE_ENV=production, HOST=0.0.0.0, PORT=3000, NOINDEX=true;
- SUPABASE_URL, SUPABASE_PUBLIC_URL, SUPABASE_ANON_KEY és SUPABASE_SERVICE_ROLE_KEY beállítva;
- SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM és NOTIFY_STAFF_EMAIL üres/nincs beállítva;
  ezeket nem módosítottuk, és nem ezek okozták a főoldali hibát.

## Kódbeli megelőzés és diagnosztika

- `menus.ts`, `content.ts`: valódi Error, a nyers adatbázishiba `cause` mezővel;
  így a szerveroldali hívási hely stackje is rendelkezésre áll.
- `src/lib/errors.ts`: nem enumerálható message/stack/cause és plain object mezők
  strukturált naplózása, körkörös cause elleni védelemmel.
- `src/start.ts`: a server-function middleware még SSR-szerializálás előtt naplóz.
  Production esetén általános Error kerül a klienshez, eredeti cause nélkül.
  Fejlesztésben az eredeti hiba marad, és a route boundary részletesen naplóz.
  Redirect/not-found/Response vezérlési értékeket nem változtat meg.
- `/api/health` marad liveness. Új `/api/ready`: site, ajánlatok, menük és PDF
  lekérdezések; hiba esetén csak általános 503 választ ad.
- Docker HEALTHCHECK most `/api/ready`, 10 s timeout (DB-kérések timeoutja 8 s).
  Sikeres process-indulás többé nem elegendő az egészséges állapothoz.
- Nincs üres étlap-fallback vagy elnyelt főoldali hiba.
- `.dockerignore`: a helyi adatbázismentések és agent konfigurációk is kizárva,
  így a build rétegeibe és a külső cache-be sem kerülhetnek.

## Elvégzett ellenőrzések

- Változatlan `fa89620` production Bun build: sikeres.
- Változatlan build Node 22 Alpine/ARM64 runtime, staging anon API: homepage 500,
  ugyanaz a PGRST205; az induló folyamat és a liveness működik.
- Javított production build és teljes Dockerfile ARM64 build: sikeres.
- Ugyanaz a javított image migrálatlan staging API-val: homepage 500, readiness 503;
  stack és eredeti cause a szervernaplóban, adatbázisrészletek nem a HTML-ben.
- Már migrált helyi Supabase + production Node/Docker: főoldali SSR/hidratáció,
  összes könyv/nyelv/kép/nagyítás, PDF-végpont, admin bejelentkező: sikeres Chrome teszt.
- Külön staging és production build: canonical URL, robots meta és robots.txt ellenőrizve;
  staging noindex, production főoldal indexelhető; admin mindkettőn noindex.
- 0010 külön izolált PostgreSQL 15-ön: 3 új könyv + megőrzött korábbi PDF,
  6 nyelvi verzió, változatlan legacy beállítás, anon olvasás és RLS policyk rendben.
- A tranzakciós wrapper külön izolált adatbázison is sikeres.
- ÉLŐ staging a 0010 után: homepage HTTP 200, SSR/hidratáció, mind a 4 könyv,
  minden elérhető nyelv, képek/nagyítás, a tényleges PDF és az admin belépő sikeres;
  nincs böngészős render/konzolhiba, staging canonical és noindex rendben.
  Az eredeti deployon még nincs `/api/ready`, ezért csak ehhez a futáshoz
  `SMOKE_LEGACY_BUILD=true` volt beállítva. A CI ezt nem állítja be, readiness ott kötelező.
- Az előkészített production ARM64/Node Docker image a kijavított valódi staging
  adatbázissal is sikeresen teljesítette a teljes böngészős tesztet, kötelező readiness ellenőrzéssel.
- Workflow statikus ellenőrzés: actionlint 1.7.12 sikeres.
- Unit: 15 fájl / 48 teszt sikeres; TypeScript sikeres; ESLint 0 hiba,
  4 meglévő Fast Refresh figyelmeztetés.

A smoke teszt nem admin belépési hitelesítést vagy feltöltést végez: a publikus
belépőoldalt ellenőrzi, jelszó és session létrehozása nélkül. A bundled menüknek
nincs PDF-jük: ilyenkor a `/etlap.pdf` dokumentált válasza 302 → `/#etlap`.

## GitHub Actions → GHCR

Workflow: `.github/workflows/ghcr.yml`.
A GitHub API szerint a repository egyetlen jelenlegi távoli branche `main`.
A helyi `origin/claude/redesign-fixes` referencia elavult; nem deploymentág.
A main a felhasználó által megadott jelenlegi staging forrás.
Nincs bizonyított production ág vagy élő production deploykiosztás.

Pontos tervezett image: **ghcr.io/szbence7/bajor-burger-and-beer**.
Architektúra: **linux/arm64**, natív GitHub-hosted `ubuntu-24.04-arm` runner.
Nem állítjuk, hogy AMD64 image is készül.

Tagek:

- `staging-sha-<teljes 40 karakteres commit SHA>` és `staging`;
- `production-sha-<teljes 40 karakteres commit SHA>` és `production`;
- nincs közös `latest`; a workflow a digestet is kiírja az összegzésbe;
- biztos rollbackhez az adott környezet SHA tagje és lehetőleg a feljegyzett digest kell.

A main push staging buildet indít. Production kizárólag kézi workflow_dispatch,
explicit environment `SOURCE_BRANCH` és production URL ellenőrzés után készülhet.
A production GitHub Environmenthez ajánlott reviewer és branch-védelem.

Sorrend: branch/env ellenőrzés → frozen install → unit/TypeScript → Docker build/load →
Node konténer + böngészős production smoke → GHCR login/push. Pontosan a tesztelt image
kerül feltöltésre, nincs második, eltérő build. A smoke az adott environment publikus
anon adatbázisát olvassa, ezért a hiányzó migráció már publikálás előtt megállítja a folyamatot.
A runnernek el kell érnie ezt a publikus API-t; Docker-belső cím nem megfelelő ide.

Cache: GitHub Actions `type=gha,mode=max`, staging/production és ARM64 külön scope.
Buildváltozó kizárólag `VITE_SITE_URL`, build-argként. A Bun verzió 1.4.4-re rögzítve.
A NOINDEX és Supabase/SMTP titkok runtime adatok; nem build-argok.
GHCR push: automatikus `GITHUB_TOKEN`, csak `contents: read` és `packages: write`.
Nincs publisher PAT. Az Actions függőségek hivatalos kiadások commit SHA-jára rögzítve.

### Beállítandó GitHub Variables/Secrets — értékek nélkül

Külön `staging` és `production` GitHub Environmentben:

| Típus    | Név                   | Szerep                                                             |
| -------- | --------------------- | ------------------------------------------------------------------ |
| Variable | `SOURCE_BRANCH`       | Explicit forráság; staging esetén main, production nincs kitalálva |
| Variable | `VITE_SITE_URL`       | Adott környezet canonical originje, záró perjel nélkül             |
| Variable | `SUPABASE_URL`        | Runnerből elérhető publikus API a read-only smoke teszthez         |
| Variable | `SUPABASE_PUBLIC_URL` | Böngészőből elérhető API URL, ha eltér                             |
| Secret   | `SUPABASE_ANON_KEY`   | Adott adatbázis anon kulcsa a smoke teszthez                       |

Később, kizárólag a staging átállítás befejezésekor:

| Típus/hely                 | Név                                                         |
| -------------------------- | ----------------------------------------------------------- |
| Repository Variable        | `ENABLE_STAGING_COOLIFY_DEPLOY` — most hiányzik/kikapcsolva |
| staging Environment Secret | `COOLIFY_STAGING_DEPLOY_WEBHOOK`                            |
| staging Environment Secret | `COOLIFY_STAGING_API_TOKEN`                                 |

`GITHUB_TOKEN` automatikus, külön beállítása nem szükséges.
Service-role/SMTP/DB URL/SSH titkokat nem igényel ez a workflow.
A staging GitHub Environment, a felsorolt staging Variables és SUPABASE_ANON_KEY Secret
a böngészős beállítás után GitHub API-val is ellenőrizve vannak.
ENABLE_STAGING_COOLIFY_DEPLOY=false; production environment nincs konfigurálva.

### Coolify későbbi átállításának követelményei — most nem végeztük el

1. Előbb legyen ellenőrzött staging séma és sikeresen publikált ARM64 image/digest.
2. A staging alkalmazás build-forrását Dockerfile/Git helyett kész registry image-re
   kell állítani: fenti image `staging` taggel, vagy rögzített staging SHA/digesttel.
   A szerveren ne legyen build és ne legyenek buildváltozók.
3. Privát GHCR esetén külön, kizárólag `read:packages` jogosultságú registry credential
   szükséges a Coolify pullhoz. A workflow rövid életű GITHUB_TOKEN-je nem szerveres pull credential.
   Publikus package-nél nem kell registry secret.
4. Megmaradó runtime: port 3000, HOST 0.0.0.0, NODE_ENV production,
   SUPABASE_URL, SUPABASE_ANON_KEY, szükség esetén SUPABASE_PUBLIC_URL,
   SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST/PORT/SECURE/USER/PASS/FROM és NOTIFY_STAFF_EMAIL.
   Ezeket a meglévő környezeti értékekből kell megtartani, nem az image-be égetni.
5. Staging NOINDEX=true; production NOINDEX=false vagy üres. A canonical origin az adott
   image buildjében legyen megfelelő. Admin továbbra is noindex.
6. `/api/ready` legyen a health/readiness ellenőrzés, startup idővel és a DB timeoutot
   meghaladó health timeouttal; publikus főoldali böngészős ellenőrzés is kell.
7. A jelenlegi Git push alapú Coolify automatikus deployt akkor kell kikapcsolni,
   amikor az image-pull átállás kész, különben megelőzheti az Actions ellenőrzéseit.
   Addig ez a workflow önmagában nem tudja vezérelni a meglévő Coolify Git triggert.
8. A webhook csak a megfelelő staging alkalmazást célozhatja. Csak ezután állítható
   true-ra az ENABLE_STAGING_COOLIFY_DEPLOY. A deploy job `needs: image` függősége
   sikeres smoke és mindkét GHCR push után engedi a hívást. Követő staging tag használatakor
   ellenőrizni kell, hogy a Coolify valóban újrapullol, nem a korábbi helyi image-et indítja.
9. Production alkalmazás, ág, adatbázis, domain és tag külön döntés és ellenőrzés tárgya.
   A workflow-ban nincs production deploy webhook; éles bekötés nincs aktiválva.
10. Rollback: azonos környezet korábban ellenőrzött image digestje, a séma kompatibilitásának
    ellenőrzésével; nincs szükség történetátírásra vagy erőforrástörlésre.

Hivatalos alapok: [GHCR és GITHUB_TOKEN](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions),
[Docker GHA cache](https://docs.docker.com/build/cache/backends/gha/).
