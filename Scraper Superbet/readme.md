In folderul acesta avem:

1. Scraper pentru toate meciurile de fotbal de pe Superbet (scraper_pagina_principala.py)
2. Parser de data (pe site datele sunt de forma Astazi 24, 16:00) -> am creeat un program separat care le face in formatul DD:MM:YYYY HH:MM (parser_date.py)
3. Un program care le uneste pe ambele (1 + 2) (scraper_pagina_principala+date_scaper.py)
4. (La momentul primului comit, nu este inca finalizat): Pentru un meci dat (in care stim nume echipa 1 + nume echipa 2), vrem sa gasim pe Superbet cotele pentru Final de meci pentru echipa 1, egal sau echipa 2. (scraper_cota_eveniment_superbet.py)
