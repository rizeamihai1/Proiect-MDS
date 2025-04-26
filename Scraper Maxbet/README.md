În acest folder găsești următoarele script-uri și fișiere:

- **scraper_toate_meciurile_maxbet.py**  
  Scanează pagina de pariuri sportive fotbal de pe MaxBet, execută scroll până se încarcă toate evenimentele și extrage pentru fiecare meci data, echipa 1, echipa 2 şi cotele „1”, „X” și „2”. Rezultatul este salvat în `maxbet_meciuri.csv`.

- **scraper_cota_eveniment_maxbet.py**  
  Primeşte ca parametri un string cu data meciului (`string_data`, de ex. `"27/04"`) şi numele celor două echipe (`team_name1`, `team_name2`), caută pagină pe MaxBet, găsește exact acel meci şi salvează cotele aferente în `maxbet_cota.csv`.

### Fișiere de ieșire

- `maxbet_meciuri.csv`  
  Conține toate meciurile de fotbal extrase cu câmpurile: `data`, `echipa1`, `echipa2`, `cota_1`, `cota_X`, `cota_2`.

- `maxbet_cota.csv`  
  Conține doar rândul meciului specificat cu aceleași câmpuri: `Data`, `team1`, `team2`, `odd_1`, `odd_X`, `odd_2`.
