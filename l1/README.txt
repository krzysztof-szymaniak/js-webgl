Krzysztof Szymaniak 250136
Pliki źródłowe opatrzone są stosownymi komentarzami wyjaśniającymi.

Sposób uruchomienia:
	zad 1-2:
		Zadania zostały połączone w jednym pliku, na dole strony znajdują się panele kontrolne odpowiedzialne za poszczególne funkcje.

		Pierwszy panel pozwala na wpisanie własnej komendy, przykładowa komenda:	repeat 4 [fw 150; lt 90; ]
		Instrukcje wprowadzania komend znajdują się na dole strony.
		
		Drugi panel pozwala na narysowanie płatka Kocha i trójkąta Sierpińskiego. 
		Suwak odpowiada za stopień krzywej, a pole tekstowe za jej rozmiar.

		Trzeci panel odpowiada za rysowanie wielokąta formenego.
		Dwa suwaki odpowiadają odpowiednio za liczbę boków i kolor figury. Pole tekstowe za jej rozmiar.

	zad 3:
		Suwak odpowiada za zmianę stopnia krzywej. Po narysowaniu figury za pomocą przycisku, 
		suwak automatycznie narysuje nową figurę z  nowym stopniem.

	zad 4:
		Poruszanie się za pomocą klawiszy W,S,A,D. 
		Rotacja kamery góra, dół, lewo prawo za pomocą klawiszy strzałek.
		Kołysanie kamerą na boki, za pomocą klawiszy Q, E.
		Kliknięcie myszką w canvas pozwala na obrót kamery myszką.  Ponowne kliknięcię wyłącza tę funckję.
		Celem gracza jest dotarcie do czerwonego prostopadłościanu. Niebieskie stanowią przeszkodę i blokują ruch gracza.
		Czarny prostopadłościan wyzancza orientacyjną granicę mapy.

	zad 5: 
		Poruszanie się analogiczne jak w poprzednim zadaniu.
		Interfejs analogiczny jak w zadaniu pierwszym.
		Przykładowa komenda rysująca sześcian:
		repeat 4 [ fw 300; lt 90; ] ut 90; fw 300; dt 90; repeat 4 [ fw 300; dt 90; fw 300; bw 300; ut 90; lt 90; ]
		