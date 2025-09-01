# WCAG Pristupačnost - Obedio Admin Web App

## Pregled

Ovaj dokument definiše kako Obedio Admin Web App primenjuje WCAG 2.1 (Web Content Accessibility Guidelines) smernice za pristupačnost. Naš cilj je da dostignemo najmanje nivo AA usklađenosti, sa težnjom ka AAA nivou gde je to moguće.

## Paleta boja i kontrasti

### Svetla tema

| Element | Boja pozadine | Boja teksta | Kontrast | WCAG Status |
|---------|---------------|-------------|----------|-------------|
| Tekst (primarni) | Bela (#FFFFFF) | Tamno siva (#475569) | 7.5:1 | AAA |
| Tekst (sekundarni) | Bela (#FFFFFF) | Srednje siva (#64748B) | 4.5:1 | AA |
| Primarna akcija (dugmad) | Plava (#2B97E9) | Bela (#FFFFFF) | 3.5:1 | AA |
| Sekundarna akcija | Zelena (#2AA836) | Bela (#FFFFFF) | 3.2:1 | AA |
| Destruktivna akcija | Crvena (#E42C2C) | Bela (#FFFFFF) | 4.1:1 | AA |
| Linkovi | Bela (#FFFFFF) | Plava (#1A7BC6) | 4.8:1 | AA+ |

### Tamna tema

| Element | Boja pozadine | Boja teksta | Kontrast | WCAG Status |
|---------|---------------|-------------|----------|-------------|
| Tekst (primarni) | Tamno plava (#1E293B) | Svetla (#F8FAFC) | 16:1 | AAA |
| Tekst (sekundarni) | Tamno plava (#1E293B) | Svetlo siva (#CBD5E1) | 10:1 | AAA |
| Primarna akcija (dugmad) | Svetlija plava (#54B9EE) | Tamna (#1E293B) | 4.5:1 | AA |
| Sekundarna akcija | Svetlija zelena (#49C356) | Tamna (#1E293B) | 4.2:1 | AA |
| Destruktivna akcija | Svetlija crvena (#EF8080) | Tamna (#1E293B) | 4.3:1 | AA |
| Linkovi | Tamno plava (#1E293B) | Svetlo plava (#7DCBF2) | 8.5:1 | AAA |

## Tekstualni sadržaj

1. **Hierarchy i organizacija**: Jasna hijerarhija zaglavlja (h1-h6) pomaže korisnicima da razumeju strukturu sadržaja
2. **Font veličine**: Minimum 16px za glavni tekst, 14px za sekundarni tekst (povećava se u responzivnim breakpointima)
3. **Line height**: Minimum 1.5 za optimalnu čitljivost
4. **Font**: Korišćen je Inter, font koji je optimizovan za čitljivost na ekranu

## Komponente korisničkog interfejsa

### Dugmad i interaktivni elementi
- Jasno vizuelno naznačeni kada su u fokusu (outline)
- Minimalna veličina 44x44px za touch targete
- Tekst i ikone imaju dovoljan kontrast u odnosu na pozadinu
- Hover i focus stanja jasno naznačena

### Formulari
- Svako polje ima jasno povezan label
- Greške su jasno naznačene vizuelno i programatski
- Pomoćni tekst za složenije unose

### Tabele
- Jasna zaglavlja tabela
- Row i column headeri pravilno definisani
- Čitljiv kontrast između redova tabele

## Testiranje i verifikacija

Sledeće metode su korišćene za testiranje pristupačnosti:

1. **Lighthouse audit** - cilj je dostići ocenu pristupačnosti od 90+
2. **Keyboard navigation** - testirana je mogućnost korišćenja svih funkcija samo putem tastature
3. **Screen reader compatibility** - NVDA (Windows) i VoiceOver (macOS)
4. **Color contrast analyzers** - verifikacija svih kontrasta boja

## Poznati problemi i plan rešavanja

1. Neki dinamički generisani elementi mogu imati probleme sa pristupačnošću
2. Potrebno je poboljšati aria-live regione za real-time obaveštenja
3. Neki modali zahtevaju dodatnu keyboard navigaciju

## Resursi

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [The A11Y Project](https://www.a11yproject.com/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
