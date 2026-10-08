// case-kit'in ?simulate=slow isteği tam 3 sn sürer; race modundaki geç yanıtların (≤3 sn) gelmesini bekletir.
http.get(`${CASE_KIT_URL}/flights?simulate=slow&limit=1`);
http.get(`${CASE_KIT_URL}/flights?simulate=slow&limit=1`);
