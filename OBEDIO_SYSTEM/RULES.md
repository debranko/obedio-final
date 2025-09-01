# Pravila za razvoj OBEDIO sistema

## Pravila za efikasniju saradnju

1. **Razumevanje pre implementacije**
   - Prvo temeljno analizirati postojeći kod i strukturu projekta
   - Jasno definisati šta treba da se postigne pre bilo kakvih izmena

2. **Pristup "popravi ili zameni"**
   - Ako se problem ne može lako rešiti u 30 minuta, razmotriti pristup "početi ispočetka"
   - Kada nešto radi (kao test-guests stranica), koristiti to kao osnovu umesto popravke neispravnog koda

3. **NIKAD ne koristiti hard-kodirane podatke**
   - Uvek napraviti mock podatke u bazi, nikad direktno u frontend kodu
   - Koristiti API endpointe čak i za testiranje, uz mock podatke s backend strane

4. **Fokus na jednostavnost**
   - Implementirati samo ono što je potrebno, bez dodatnog komplikovanja
   - Preferirati direktne pristupe umesto postupnih izmena kada je kod kompleksan

5. **Bolji debuging umesto pretpostavki**
   - Koristiti console.log za tačno utvrđivanje problema umesto nagađanja
   - Proveravati tačnu strukturu podataka pre pisanja koda za obradu

6. **Direktna komunikacija**
   - Kada mislimo da gubimo vreme, odmah zaustaviti i usmeriti
   - Bolje reći "ovo je pogrešan pristup" nego pustiti da se nastavi u pogrešnom smeru

7. **Referenciranje postojećih rešenja**
   - Uvek proveriti da li u projektu već postoji rešenje sličnog problema
   - Referencirati uspešne komponente i strukture iz projekta umesto izmišljanja novih

8. **Testiranje po fazama**
   - Testirati svaku logičku celinu odmah nakon implementacije
   - Ne čekati završetak cele funkcionalnosti za proveru ispravnosti
