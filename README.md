# Maffi Bhall — Portfolio

Personal portfolio and résumé site of Maffi Bhall, AI web engineer and founder of [A&N Web Services](https://www.anwebservice.com).

Live site: https://maffi-devi.github.io/

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Single-page site: About, Experience, Projects, Skills, Training, Education, FAQ, Contact |
| `assets/styles.css` | All styles |
| `assets/main.js` | Navigation, scroll reveal, image lightbox and the scam message checker demo |
| `assets/img/` | Photos, certificates and screenshots |
| `resume.html` | Source of the résumé |
| `assets/Maffi_Bhall_Resume.pdf` | Résumé PDF generated from `resume.html` |
| `llms.txt`, `robots.txt`, `sitemap.xml` | Search engine and AI crawler files |

The site is plain HTML, CSS and JavaScript with no build step.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
```

## Update the résumé

Edit `resume.html`, then open it in Chrome and print to PDF (A4, headers and footers off), or run:

```bash
chrome --headless --no-pdf-header-footer --print-to-pdf=assets/Maffi_Bhall_Resume.pdf resume.html
```

## Deploy

The site is hosted on GitHub Pages from the `main` branch of `Maffi-Devi/maffi-devi.github.io`.
