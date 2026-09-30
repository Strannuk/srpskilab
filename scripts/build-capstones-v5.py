#!/usr/bin/env python3
"""Original B1/B2 capstone manuscripts for additional practice.
Not a substitute for a CEFR-certified examination or independent Serbian proofread.
"""
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]

cases = [
(
'm18l10','B1','Один день, два вида: ремонт в квартире',
'''U subotu sam planirao da sredim stan. Ujutru sam prvo čistio kuhinju, a onda sam očistio prozore. Dok sam brisao sto, zazvonio je telefon. Komšija me je pitao da li mogu da mu pomognem oko stare police. Nisam mogao odmah da dođem, jer sam još radio u kuhinji, ali sam obećao da ću svratiti kasnije.

Posle ručka sam otišao kod njega. Pokušavali smo da pomerimo policu, ali je bila preteška. Najzad smo pozvali još jednog komšiju i zajedno smo je preneli u drugu sobu. Dok smo radili, razgovarali smo o zgradi i dogovorili se da sledeće nedelje uredimo zajednički hodnik.

Uveče sam zapisao šta sam uradio, a šta nisam stigao da završim. Shvatio sam da je važno razlikovati radnju koja traje od radnje koja ima jasan rezultat. Sutra ću nastaviti da sređujem stan, ali ću prvo završiti ono što sam već započeo.''',
['Почему «čistio sam» и «očistio sam» описывают разные стороны действия?', 'Какое событие прервало уборку?', 'Что участники смогли сделать только с помощью третьего соседа?', 'Найди два выражения будущего времени и объясни смысл вида глагола.'],
['«Čistio sam» — процесс; «očistio sam» — результат.', 'Зазвонил телефон, сосед попросил помочь.', 'Перенести тяжёлую полку.', '«ću nastaviti» и «ću prvo završiti»: продолжение и достижение результата.'],
'Напиши рассказ о делах за выходные (120–150 слов). Используй минимум четыре пары несовершенного и совершенного вида. Объясни, какие дела шли долго, а какие были завершены.',
'Перескажи день от лица соседа, изменив последовательность событий. Не читай исходный текст. Отдельно объясни, почему ты выбираешь vid glagola.'),
(
'm19l10','B1','Когда план зависит от условий',
'''Maja i Nikola pripremali su zajednički događaj u lokalnoj biblioteci. Maja je predložila da okupe stanare i razmene knjige koje više ne čitaju. Nikola je rekao da bi događaj bio koristan, ali da najpre treba proveriti da li je prostor slobodan.

„Ako dobijemo salu u subotu, mogli bismo da pozovemo više ljudi“, rekla je Maja. Nikola joj je odgovorio da će poslati poruku upravnici i da će joj javiti čim dobije odgovor. Obećao je i da će pitati prijatelja koji pravi plakate. Međutim, Maja se brinula zato što je ostalo malo vremena. Zato su odlučili da pripreme jednostavan poziv koji bi mogli da pošalju elektronskom poštom.

Sutradan je upravnica potvrdila termin, ali je zamolila organizatore da završe događaj do osam sati. Nikola je preneo Maji da imaju salu i objasnio joj je zašto moraju da promene raspored. Njih dvoje su se složili da prvo organizuju razmenu knjiga, a zatim kratko predstavljanje novih naslova.''',
['Чем «ako dobijemo» отличается от «kada dobijemo» в этой ситуации?', 'Кому Никола обещал сообщить ответ?', 'Укажи причину, следствие и относительное придаточное.', 'Передай сообщение управницы косвенной речью.'],
['«Ako» оставляет получение зала условием, а «kada» подразумевало бы ожидаемое событие.', 'Майе.', 'Причина «zato što je ostalo malo vremena»; следствие «Zato su odlučili»; «knjige koje više ne čitaju».', 'Upravnica je rekla da imaju salu, ali da moraju da završe događaj do osam sati.'],
'Составь письмо партнёру о подготовке встречи (120–160 слов): два условия, причина задержки, план Б и не менее двух клитик в естественном месте.',
'Обсуди с собеседником две версии мероприятия. Используй ako, zato što, koji и фразу «Mogli bismo da...». Затем перескажи его ответ.'),
(
'm20l10','B1','Разговор с соседом и регистр',
'''Kada se Lena uselila u novu zgradu, želela je da se predstavi komšijama. Na stepeništu je srela stariju gospođu i rekla: „Dobar dan, ja sam Lena. Nedavno sam se doselila. Drago mi je.“ Gospođa joj se nasmešila i odgovorila: „Dobro došli! Ako vam nešto treba, slobodno pitajte.“

Kasnije je Lena čula buku iz susednog stana. Nije želela odmah da se žali, jer nije znala šta se događa. Pokucala je i ljubazno pitala: „Izvinite, da li biste mogli malo da utišate muziku? Sutra rano ustajem.“ Mladi komšija je odgovorio: „Naravno, nema problema. Izvinite, nisam znao da vam smeta.“

Sutradan su se sreli u prodavnici. Komšija joj je rekao: „Ćao, kako ide?“ Lena je shvatila da se u neformalnom razgovoru često koriste kraće, prisnije formule, dok se u prvom susretu ili pri molbi nepoznatoj osobi obično bira pažljiviji način obraćanja. Nije svaka kratka rečenica nepristojna: sve zavisi od odnosa, tona i situacije.''',
['Какие признаки вежливого обращения есть в первой просьбе?', 'Какая реплика соседа показывает принятие просьбы?', 'Почему Лена не начала с жалобы?', 'Напиши более неформальный вариант просьбы другу, не меняя её смысл.'],
['«Izvinite», «da li biste mogli», обращение на «vi».', '«Naravno, nema problema.»', 'Она ещё не знала причину шума.', '«Možeš li malo da utišaš muziku?» — допустимая модель для знакомого.'],
'Напиши два варианта сообщения о шуме: соседу, с которым ты знаком, и незнакомому управляющему. Объясни, что и почему изменилось.',
'Разыграй знакомство, вежливую просьбу и завершение разговора. Затем повтори диалог в неформальном регистре.'),
(
'm21l10','B1','История о пропавшей папке',
'''Pre nekoliko dana Ana je krenula u opštinu da preda jedan zahtev. Ranije je uvek čuvala dokumenta u istoj fascikli, ali tog jutra je žurila. Dok je čekala autobus, primetila je da fascikle nema u torbi.

Prvo je pomislila da ju je ostavila kod kuće. Pozvala je brata, koji je proverio sto i policu, ali ništa nije našao. Zatim se setila da je prethodnog dana svratila u kopirnicu. Telefonirala je tamo i pitala da li je neko pronašao plavu fasciklu. Radnica je rekla da je jedan kupac ostavio nekoliko papira, ali da ne zna kome pripadaju.

Ana je otišla u kopirnicu, pokazala lični dokument i prepoznala svoje papire. Bila je veoma zahvalna, ali je shvatila da toga dana više neće stići da preda zahtev. Zato je promenila plan i proverila radno vreme službe za naredni dan. Uveče je napravila spisak dokumenata kako joj se slična situacija ne bi ponovila. Iako joj je jutro bilo stresno, problem je na kraju rešila mirno.''',
['В каком моменте героиня обнаружила проблему?', 'Какую ложную гипотезу она проверила первой?', 'Каким образом нашла документы?', 'Передай историю в четырёх предложениях с маркерами времени.'],
['Во время ожидания автобуса.', 'Что папка осталась дома.', 'Позвонила в копировальный центр и пришла за бумагами.', 'Возможны разные последовательные пересказы; сохрани сначала/затем/после этого/в конце.'],
'Опиши реальную или вымышленную ситуацию, когда план пришлось изменить. Минимум 140 слов: фон, неожиданное событие, два действия, решение и итог.',
'Расскажи историю за две минуты без текста. Собеседник задаёт три уточняющих вопроса о причине, времени и решении.'),
(
'm22l10','B1','Собеседование: обязанности и график',
'''Na razgovoru za posao kandidat Marko predstavio je svoje prethodno iskustvo. Radio je u korisničkoj podršci i često je rešavao tehničke probleme. Rekao je da ume da objasni složenu situaciju jednostavnim rečima i da rado sarađuje sa kolegama.

Poslodavka ga je pitala šta radi kada ne može odmah da reši problem. Marko je odgovorio da najpre proverava podatke, zatim se konsultuje sa iskusnijim članom tima i obaveštava korisnika o sledećem koraku. Naglasio je da ne obećava rok koji ne može da potvrdi.

Kada su razgovarali o radnom vremenu, Marko je rekao da mu je važan unapred poznat raspored. Povremeno mora da ode u neku ustanovu tokom radnog dana, pa ga je zanimalo da li je moguće zameniti smenu ili nadoknaditi sate. Poslodavka je objasnila kako tim dogovara izmene rasporeda i predložila probni zadatak. Na kraju su se zahvalili jedno drugom i dogovorili da će sledećeg dana razgovarati o rezultatima.''',
['Назови три профессиональных навыка кандидата.', 'Что Марко делает, если не может решить проблему сразу?', 'Как он вежливо задаёт вопрос о гибкости графика?', 'Чем отличается «obeštava» от «obećava» по значению?'],
['Техническая поддержка, объяснение, работа в команде.', 'Проверяет данные, консультируется, информирует клиента.', 'Интересуется возможностью замены смены или компенсации часов.', '«Obaveštava» — сообщает; «obećava» — обещает.'],
'Напиши краткое мотивационное письмо (150–180 слов) на вакансию: опыт, навыки, ограничения графика, один конкретный пример решения проблемы.',
'Проведи двухминутное собеседование: почему эта работа, случай конфликта, вопрос о графике и заключительная реплика.'),
(
'm23l10','B1','Претензия без агрессии',
'''Jelena je prijavila problem sa internetom u ponedeljak ujutru. Operater joj je potvrdio da je prijava zabeležena i rekao da će je neko kontaktirati. Međutim, do utorka uveče niko je nije pozvao. Jelena je zato ponovo kontaktirala podršku.

Umesto da optužuje radnika koji se javio, mirno je objasnila hronologiju: „Prijavila sam kvar u ponedeljak u devet sati. Dobila sam potvrdu, ali još nemam informaciju o terminu dolaska tehničara.“ Zatim je postavila dva konkretna pitanja: da li je prijava i dalje aktivna i kada može da očekuje sledeće obaveštenje.

Operater je proverio podatke i rekao da se radovi nastavljaju. Nije mogao da potvrdi tačno vreme završetka. Jelena je zamolila da joj pošalju pisani odgovor i broj prijave kako bi mogla da prati postupak. Na kraju je ponovila ono što su dogovorili i zahvalila na proveri. Problem još nije bio rešen, ali su obe strane znale koji je sledeći korak.''',
['В какой день и час была подана первая заявка?', 'Какие два вопроса задаёт Елена?', 'Почему она просит письменное подтверждение?', 'Найди в тексте пример нейтральной формулировки без обвинения.'],
['В понедельник в девять утра.', 'Активна ли заявка и когда придёт следующее уведомление.', 'Чтобы иметь номер и отслеживать обращение.', '«Još nemam informaciju o terminu...» — описание факта.'],
'Напиши повторное обращение (140–180 слов): факты с датами, что уже предпринималось, два проверяемых вопроса, просьба о письменном ответе.',
'Сыграй звонок в поддержку: собеседник не знает деталей; объясни хронологию и добейся конкретного следующего шага без грубости.'),
(
'm24l10','B1','От новости к проверенной информации',
'''U lokalnoj grupi pojavila se poruka da će jedna autobuska linija uskoro promeniti trasu. Neki članovi grupe odmah su počeli da dele informaciju, dok su drugi pitali gde je objavljeno zvanično obaveštenje.

Mina je pročitala poruku, ali nije želela da je prosledi bez provere. Otvorila je sajt prevoznika i pronašla ranije obaveštenje o radovima na putu. U tekstu se pominjao privremeni zastoj, ali nije pisalo da će linija trajno promeniti trasu. Zatim je pozvala informativni centar i pitala da li je objavljeno novo obaveštenje. Dobila je odgovor da su detalji još u pripremi.

Mina je u grupi napisala: „Za sada nisam našla potvrdu da se trasa trajno menja. Prevoznik je ranije najavio privremene radove, ali treba sačekati ažurirane informacije.“ Dodala je izvor i datum objave. Nekima se činilo da je previše oprezna, ali njen cilj nije bio da pobedi u raspravi, već da jasno odvoji ono što se zna od onoga što se pretpostavlja.''',
['Какое утверждение не было подтверждено?', 'Что действительно было опубликовано ранее?', 'Как Мина обозначила неопределённость?', 'Составь нейтральный заголовок, который не преувеличивает новость.'],
['Постоянное изменение маршрута.', 'Временные дорожные работы.', '«Za sada nisam našla potvrdu... treba sačekati...»', 'Например: «Proveravaju se informacije o mogućoj izmeni autobuske linije».'],
'Составь краткое сообщение (130–160 слов) о непроверенной новости. Ясно выдели факт, источник, предположение и то, что остаётся неизвестным.',
'Расскажи новость двум слушателям: другу неформально и на учебной презентации официально. Не превращай предположение в факт.'),
(
'm25l10','B2','Редактор делает смысл точнее',
'''Upravnik zgrade napisao je poruku stanarima: „Neko je nešto ostavio u hodniku, to smeta i mora da se skloni odmah.“ Poruka je izazvala raspravu, jer nije bilo jasno o kom predmetu je reč, na koji se deo hodnika odnosi zahtev niti ko treba da reaguje.

Jedna stanarka predložila je precizniju verziju: „U zajedničkom hodniku ispred stana broj osam nalazi se veliki ormar koji otežava prolaz. Molimo vlasnika da ga, ukoliko je moguće, premesti do petka. Ako postoje prepreke, neka se javi upravniku kako bismo zajedno pronašli rešenje.“ Tako je uklonila neodređene reči i dodala informacije koje omogućavaju razumnu reakciju.

Ipak, drugi stanar je primetio da izraz „do petka“ može da bude nejasan ako se poruka čita sledeće nedelje. Predložio je da se napiše pun datum. Takođe je smatrao da bi trebalo razlikovati zahtev od obaveštenja: u prvom slučaju očekuje se odgovor, a u drugom se samo saopštava stanje.

Urediti tekst ne znači učiniti ga dužim. Ponekad je dovoljno promeniti red reči, zameniti jednu neodređenu imenicu konkretnom ili objasniti uslov. Dobro napisana poruka omogućava primaocu da razume šta se dogodilo, šta se od njega traži i šta može da uradi ako se ne slaže.''',
['Назови три проблемы исходной записки.', 'Какие сведения внесла редактор?', 'Почему слово «petak» лучше заменить полной датой?', 'Как отличить в этой ситуации informaciju от zahteva?'],
['Неопределённый предмет, место и адресат.', 'Место, описание препятствия, просьба, срок и контакт.', 'Дата останется ясной при чтении позже.', 'Zahtev ожидает реакции/действия, informacija лишь сообщает факт.'],
'Отредактируй неясную служебную записку (180–220 слов). Сохрани нейтральный тон, устрани неоднозначности и объясни три редакторских решения.',
'Проведи устную редакторскую консультацию. За две-три минуты аргументируй, какие изменения текста обязательны, а какие стилистические.'),
(
'm26l10','B2','От кухни к официальному письму',
'''Dvoje prijatelja razgovaralo je o organizaciji zajedničkog putovanja. „Ma nema šanse da krenemo u šest, znaš da niko neće stići na vreme“, rekao je Luka. Sara mu je odgovorila: „Dobro, polako. Da vidimo šta stvarno možemo da dogovorimo.“ U toj situaciji opušten ton nije nikome smetao.

Kasnije je Sara trebalo da pošalje isto obaveštenje članovima udruženja koji se međusobno ne poznaju. Odlučila je da izbegne izraze koji bi mogli da zvuče previše prisno ili optužujuće. Umesto „nema šanse“, napisala je: „Polazak u šest sati verovatno ne bi odgovarao većini učesnika. Predlažemo da razmotrimo termin u osam sati.“

Nije samo rečnik bio drugačiji. U neformalnom razgovoru govornici su mogli da upadaju jedan drugome u reč i da se oslone na zajedničko iskustvo. U pisanom obaveštenju morali su jasno navesti vreme, mesto okupljanja i način potvrde. Sara je dodala: „Molimo vas da svoj odgovor pošaljete do četvrtka.“

Kada je Luka pročitao poruku, rekao je da zvuči malo hladno. Sara je objasnila da formalan stil ne mora da bude neljubazan. Cilj je da ljudi koji se ne poznaju razumeju isto i da niko ne pomisli da je raniji termin otkazan bez dogovora.''',
['Какая формула была уместна между друзьями, но менее подходяща в письме?', 'Как Сара смягчила категоричное утверждение?', 'Что необходимо указать в официальном сообщении дополнительно?', 'Почему формальный регистр не обязательно означает холодность?'],
['«Ma nema šanse».', '«verovatno ne bi odgovarao... Predlažemo...»', 'Время, место и срок ответа.', 'Он делает инструкции однозначными для незнакомых адресатов.'],
'Напиши две версии приглашения (по 100–130 слов каждая): другу и группе незнакомых участников. Отдельно прокомментируй отличия регистра.',
'Перескажи план встречи, затем адаптируй свой голос и лексику для формального доклада без потери смысла.'),
(
'm27l10','B2','Спор о городском пространстве',
'''Na sastanku mesne zajednice raspravljalo se o tome da li jednu ulicu treba delimično zatvoriti za automobile. Prva grupa stanara podržavala je predlog jer bi deca imala bezbedniji put do škole. Druga grupa strahovala je da bi se saobraćaj preusmerio u susedne ulice i da bi stanovnici tamo imali još više buke.

Milena je započela izlaganje tako što je priznala opravdanost oba pitanja. Smatrala je da bezbednost pešaka treba da bude važan cilj, ali je upozorila da se posledice za okolne ulice ne smeju zanemariti. Predložila je probni period od mesec dana, tokom kog bi se merili broj automobila, brzina kretanja i mišljenja stanovnika.

Petar se usprotivio tvrdnji da će zabrana automatski smanjiti gužvu. „Na osnovu čega to zaključujemo?“, pitao je. Milena je odgovorila da njen predlog nije dokaz da će sve biti bolje, već način da se dobiju podaci pre trajne odluke.

Na kraju sastanka nisu svi promenili mišljenje, ali su se složili da je korisno razdvojiti vrednosni cilj od proverljive činjenice. Bezbednost, pristupačnost i mir u naselju mogu biti zajednički ciljevi; pitanje je koja mera pod datim uslovima postiže najbolji odnos koristi i mogućih posledica.''',
['Определи два главных аргумента противоположных сторон.', 'Как Милена отделяет гипотезу от доказательства?', 'Зачем предложен пробный период?', 'Приведи контраргумент к позиции Милены, не искажая её мысли.'],
['Безопасность детей и риск перенаправления движения.', 'Она прямо говорит, что предложение — способ получить данные, а не доказательство успеха.', 'Чтобы проверить последствия до постоянной меры.', 'Например: даже временная мера может создать проблемы для соседних улиц; нужен план мониторинга.'],
'Напиши аргументированную заметку (220–280 слов). Тезис, два довода, справедливое изложение возражений и реалистичный вариант проверки гипотез.',
'Устрой дебаты: сформулируй сильный довод одной стороны, перескажи позицию оппонента без искажения, затем предложи компромисс.'),
(
'm28l10','B2','Проект, срок и риск',
'''Mali razvojni tim pripremao je novu verziju aplikacije za učenje jezika. Na početku sastanka menadžer je rekao: „Želim da sve bude gotovo do petka.“ Programerka je zamolila da najpre razjasne šta znači „sve“. Tim je imao tri različita zadatka: ispravku grešaka, proveru pristupačnosti i snimanje novih audio-materijala.

Ispostavilo se da snimanje zavisi od saradnika koji neće biti dostupan do četvrtka. Umesto da obećaju neproverljiv rok, članovi tima napravili su spisak obaveznih uslova za objavljivanje. Ispravke koje utiču na prijavljivanje korisnika i čuvanje rezultata označene su kao kritične. Novi audio-materijali ostali su u posebnoj verziji dok ne prođu proveru kvaliteta.

Menadžer je predložio da se javnosti objavi samo ono što je zaista testirano, a da se ostale funkcije predstave kao planirane. U zapisniku je navedeno ko je odgovoran za svaki zadatak, kada se očekuje provera i šta se radi ako rok ne može da se ispuni.

Na kraju su se složili da uspeh projekta ne znači samo poštovanje datuma. Kvalitet uključuje i iskreno obaveštavanje korisnika o tome šta je dostupno, šta se još proverava i kako prijaviti problem.''',
['Что делает первоначальную цель слишком неопределённой?', 'Какая внешняя зависимость мешает полному выпуску?', 'Какие задачи признаны критичными?', 'Как команда меняет формулировку успеха?'],
['Слово «sve» не определяет объём работ.', 'Доступность человека, записывающего аудио.', 'Авторизация и сохранение результатов.', 'Успех — протестированные функции, прозрачность и понятный план.'],
'Напиши протокол встречи (200–260 слов): принятое решение, ответственные, зависимости, риск, критерии готовности и план Б.',
'Презентуй решение о выпуске версии за три минуты, ответь на два сложных вопроса о сроках без необоснованных обещаний.'),
(
'm29l10','B2','Официальное письмо с ясной целью',
'''Građanin je želeo da proveri status ranije podnetog zahteva. Njegova prva poruka glasila je: „Poštovani, šta se dešava sa mojim papirima? Čekam dugo. Odgovorite što pre.“ Iako je razlog obraćanja bio razumljiv, poruka nije sadržala broj predmeta, datum podnošenja niti konkretno pitanje o tome da li su dokumenta kompletna.

U drugoj verziji naveo je: „Poštovani, obraćam vam se povodom zahteva podnetog 15. septembra, pod brojem koji je naveden u potvrdi o prijemu. Molim vas za informaciju o trenutnom statusu postupka. Da li je dokumentacija kompletna i da li je potrebno da dostavim još nešto? Takođe bih vam bio zahvalan ako biste mogli da mi kažete kada se okvirno može očekivati odgovor.“

Pisac nije pretpostavio da služba mora da odgovori do određenog dana, jer za takav zaključak nije imao potvrđene informacije. Umesto toga zamolio je da mu navedu očekivani rok. Dodao je puno ime i način na koji ga služba može kontaktirati, ali nije slao nepotrebne lične podatke.

Dobro službeno pismo povezuje činjenice i zahteve. Osnovni cilj nije da zvuči što ozbiljnije, već da primalac može da utvrdi o kom predmetu je reč i da razume na koja pitanja treba da odgovori.''',
['Чего не хватает в первом письме?', 'Назови два конкретных вопроса второго письма.', 'Почему автор не заявляет обязательный срок ответа?', 'Какие данные уместны и какие излишни?'],
['Номера дела, даты подачи и ясных вопросов.', 'Полнота документов и необходимость дополнений; также примерный срок.', 'Нет подтверждённой информации о нормативном сроке.', 'Идентификатор дела и обратный контакт уместны; лишние персональные сведения не нужны.'],
'Напиши официальное обращение (180–220 слов) о статусе условного заявления. Добавь тему, основание, два вопроса, просьбу о сроке и корректное завершение.',
'Сначала изложи содержание письма сотруднику по телефону за 90 секунд, затем перефразируй его для письменной формы.'),
(
'm30l10','B2','Интервью и точная передача смысла',
'''Voditeljka: Kada ste prvi put shvatili da projektna ideja zahteva promenu?

Sagovornik: U početku smo verovali da je korisnicima najvažnije da što brže dobiju odgovor. Međutim, posle nekoliko razgovora ispostavilo se da mnogi pre svega žele da znaju koliko je odgovor pouzdan. Zato smo odlučili da promenimo način prikazivanja rezultata.

Voditeljka: Znači li to da je brzina postala nevažna?

Sagovornik: Ne bih to tako rekao. Brzina je i dalje važna, ali nije jedini kriterijum. Ako korisnik dobije brz odgovor koji kasnije mora da ispravlja, ukupno može da izgubi više vremena.

Voditeljka: A šta je bilo najteže tokom promene?

Sagovornik: Najteže je bilo objasniti zašto neke funkcije nećemo objaviti odmah. Ljudi obično vide samo gotov proizvod, a ne vide šta se dešava između ideje i provere. Morali smo da priznamo neizvesnost i da navedemo šta još ne znamo.

Voditeljka: Šta biste poručili nekome ko sada započinje sličan projekat?

Sagovornik: Pre nego što obećate rezultat, dogovorite kako ćete proveriti da li ste ga postigli. I ostavite dovoljno prostora za pitanje koje niste očekivali.''',
['Как изменилась оценка потребностей пользователей?', 'Отрицает ли собеседник важность скорости?', 'В чём состояла трудность объяснения изменений?', 'Перескажи главное утверждение без приписывания несуществующего вывода.'],
['Надёжность ответа важнее, чем предполагали вначале.', 'Нет, он считает её важной, но не единственной.', 'Нужно было объяснить причины отложенного выпуска и неопределённость.', 'Речь о необходимости заранее согласовать критерии проверки результата.'],
'Напиши аналитический пересказ интервью (190–240 слов). Отдели прямую речь от собственного комментария, сохрани оговорки и причинные связи.',
'Прослушай материал без текста, ответь на вопросы, затем сделай устное резюме за две минуты и уточни смысл двух сложных выражений.'),
(
'm31l10','B2','Итоговый проект: адаптация в новом городе',
'''Porodica se preselila u novi grad i u kratkom roku morala je da reši nekoliko praktičnih pitanja. Trebalo je da pronađu dugoročan smeštaj, da saznaju kako funkcioniše školski raspored i da usklade radno vreme sa obavezama u porodici. Umesto da pokušaju sve odjednom, napravili su listu zadataka prema hitnosti.

Prvo su razgovarali sa stanodavcem o načinu prijavljivanja kvarova u stanu. Tražili su da uslovi budu navedeni jasno, naročito kada je reč o obaveštavanju i pristupu stanu. Zatim su kontaktirali školu kako bi proverili koje informacije su potrebne za učešće deteta u planiranim aktivnostima. Nisu pretpostavljali da su pravila ista kao u zemlji iz koje su došli; tražili su konkretno objašnjenje.

Kada se pojavilo pitanje radnog rasporeda, jedan član porodice predložio je da razgovara sa poslodavcem. Objasnio je koje termine nije moguće menjati i ponudio nekoliko načina da se posao ipak završi na vreme. Razgovor nije odmah rešio sve, ali je pokazao da se potrebe mogu uskladiti ako obe strane razumeju ograničenja.

Na kraju meseca članovi porodice nisu mogli da kažu da su savladali sve administrativne procedure. Ipak, uspeli su da se dogovore o jasnim sledećim koracima, da napišu pristojne poruke i da razlikuju proverenu informaciju od pretpostavke. Shvatili su da samostalnost ne znači da nikada ne tražiš pomoć, već da umeš da postaviš pravo pitanje.''',
['Выдели три независимые бытовые задачи семьи.', 'Почему они не переносили автоматически правила своей страны?', 'Как сотрудник предлагал согласовать график?', 'Как автор определяет самостоятельность в последнем предложении?'],
['Жильё, школа, рабочий график.', 'Нужно проверять конкретные местные требования, а не предполагать сходство.', 'Объяснил ограничения и предложил варианты.', 'Умение задавать правильные вопросы и договариваться, а не отказ от помощи.'],
'Подготовь портфолио (250–350 слов): письмо арендодателю, запрос в школу, сообщение работодателю и итоговая записка. Каждый фрагмент — свой регистр.',
'Проведи четырёхминутную презентацию о решении бытовых задач; оппонент меняет два условия, после чего скорректируй план и обоснуй решение.'),
]

out=[]
for lid,level,title,passage,questions,models,writing,speaking in cases:
    assert len(questions)==len(models)==4
    assert len(passage.split())>=105,(lid,len(passage.split()))
    out.append(dict(id=lid,level=level,title=title,passage=passage.strip(),questions=[dict(id=f'{lid}-c{j+1}',question=q,model=models[j]) for j,q in enumerate(questions)],writing=writing,speaking=speaking,editorialStatus='author_draft_unreviewed',recordingStatus='synthetic_unreviewed'))
path=P/'src/content/capstones-b1-b2-v5.json'
path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('CAPSTONES',len(out),'SERBIAN_WORDS',sum(len(c['passage'].split()) for c in out),'READING_QUESTIONS',sum(len(c['questions']) for c in out))
