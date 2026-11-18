namespace WorkDex.Api.Services;

// Xarid shablonidagi standart materiallar ro'yxati — "Materiallar_UA" smetasidagi tartib va bo'limlar bo'yicha,
// o'zbek tilida. Ruscha asl nomlar importda o'zbekchaga o'giriladi (eski ruscha smetani yuklaganda
// katalogda dublikat paydo bo'lmasligi uchun).
public partial class MaterialService
{
    private sealed record DefaultMaterial(string Name, string Russian, string Unit);
    private sealed record DefaultSection(string Title, string Russian, string Category, DefaultMaterial[] Items);

    private static DefaultMaterial M(string name, string russian, string unit = "dona") => new(name, russian, unit);

    private const string Lift = "Materialni ko'tarish", LiftRu = "Подъем материала";
    private const string Delivery = "Yetkazib berish", DeliveryRu = "доставка";

    private static readonly DefaultSection[] DefaultPurchaseSections =
    {
        new("Santexnika ishlari", "Сантехнические работы", "Santexnika", new[]
        {
            M("Sovuq suv quvuri 20 mm PN 16 spk", "ХВС труба 20 мм PN 16 spk", "metr"),
            M("Sovuq suv quvuri 25 mm PN 16 spk", "ХВС труба 25 мм PN 16 spk", "metr"),
            M("Issiq suv quvuri 20 mm PN 20 spk", "ГВС труба 20 мм PN 20 spk", "metr"),
            M("Issiq suv quvuri 25 mm PN 20 spk", "ГВС труба 25 мм PN 20 spk", "metr"),
            M("Mufta 20 mm", "Муфта 20 мм"),
            M("Mufta 25 mm", "Муфта 25 мм"),
            M("Otvod 20 mm spk 90°", "Отвод 20 мм spk 90°"),
            M("Otvod 25 mm spk 90°", "Отвод 25 мм spk 90°"),
            M("Yarim otvod 20 mm spk 45°", "Полуотвод 20 мм spk 45°"),
            M("Yarim otvod 25 mm spk 45°", "Полуотвод 25 мм spk 45°"),
            M("Troynik 20 mm spk", "Тройник 20 мм spk"),
            M("Troynik 25 mm spk", "Тройник 25 мм spk"),
            M("Perexodnik 25/20 spk", "Переходник 25/20 spk"),
            M("O'tish troynigi 25/20/25 mm", "Тройник переход 25/20/25 мм"),
            M("Adapter 25 ichki rezba", "Адаптар 25 Вр"),
            M("Adapter 25*1/2 ichki rezba", "Адаптар 25*1/2 Вр"),
            M("Burchakli adapter 20*1/2 tashqi rezba", "Угол Адаптар 20*1/2 Нр"),
            M("Aylanma (most) 20 mm", "Мост 20 мм"),
            M("Aylanma (most) 25 mm", "Мост 25 мм"),
            M("Quloqli tirsak 20 ichki rezba", "Ущастик 20 Вр"),
            M("Qo'sh quloqli tirsak 20 ichki rezba", "Ущастик двойной 20 Вр"),
            M("Radiator burchak krani 20*1/2 PPR", "Угловой кран радиатора 20*1/2 PPR сап"),
            M("Penopleks", "Пеноплекс"),
            M("Xomut 50", "Хомут 50"),
            M("Kanalizatsiya quvuri 100/1 m", "100/1м"),
            M("Kanalizatsiya quvuri 50/2 m", "50/2м"),
            M("Kanalizatsiya quvuri 50/1 m", "50/1м"),
            M("Kanalizatsiya quvuri 50/0,5 m", "50/0,50м"),
            M("Kanalizatsiya otvodi 50", "Отвод 50"),
            M("Kanalizatsiya otvodi 100", "Отвод 100"),
            M("Kanalizatsiya yarim otvodi 50", "Полотвод 50"),
            M("Kanalizatsiya yarim otvodi 100", "Полотвод 100"),
            M("To'g'ri troynik 50", "Тройник прямой 50"),
            M("Radiator ROYAL alyuminiy 7 seksiya (5 dona)", "Радиатор ROYAL алюмин 7 сек 5 шт"),
            M("Quvur izolyatsiyasi Energoflex 22/6 ko'k", "Изоляция для трубы Energoflex 22/6 кук"),
            M("Quvur izolyatsiyasi Energoflex 22/6 qizil", "Изоляция для трубы Energoflex 22/6 кизил"),
            M("Quvur izolyatsiyasi Energoflex 28/6 ko'k", "Изоляция для трубы Energoflex 28/6 кук"),
            M("Quvur izolyatsiyasi Energoflex 28/6 qizil", "Изоляция для трубы Energoflex 28/6 кизил"),
            M("Issiq pol shlangi (Turkiya, alyuminiy)", "Шланг для тёп. пола Турция алюмин", "metr"),
            M("Skoba", "скоба"),
            M("Gidro-parobaryer", "Гидропарабарьер"),
            M("Installyatsiya", "инсталяца"),
            M("Uzaytirgich 5 sm", "Удлинител 5см"),
            M("Parashyut", "Парашют"),
            M("Xona termostati", "Комнатный термостат"),
            M("7 chiqishli kollektor, sarf o'lchagichli (komplekt)", "Коллектор на 7 выходов с расходомером (комплект)"),
            M("Termogolovkalar", "Термоголовки"),
            M("Chastotali nasosli mikser guruhi (komplekt)", "Микшерная группа с частотным насосом (комплект)"),
            M("Plastinali issiqlik almashtirgich", "Пластинчатый теплообменник"),
            M("Rashbak, uch yo'lli klapan, fitinglar (komplekt)", "Рашбак, трехходовой клапан, фитинги (комплект)"),
            M(Delivery, DeliveryRu),
            M(Lift, LiftRu),
        }),
        new("Elektr ishlari", "Электрические работы", "Elektr", new[]
        {
            M("Kabel VVGng(A) 3x1,5", "ВВГнг(А) 3х1,5", "metr"),
            M("Kabel VVGng(A) 3x2,5", "ВВГнг(А) 3х2,5", "metr"),
            M("Kabel VVGng(A) 4x4", "ВВГнг(А) 4x4", "metr"),
            M("Kabel VVGng(A) 4x6", "ВВГнг(А) 4x6", "metr"),
            M("Kabel VVGng(A) 4x10", "ВВГнг(А) 4x10", "metr"),
            M("Kabel PUGNP 2x1,5", "ПУГНП 2х1,5", "metr"),
            M("Kabel VVGng(A) 2x1,5", "ВВГнг(А) 2х1,5", "metr"),
            M("Kabel VVGng(A) 2x2,5", "ВВГнг(А) 2х2,5", "metr"),
            M("Internet kabeli F/UTP Cat 5e PE 4x2x0,52-145", "F/UTP Cat 5e PE 4x2x0,52-145", "metr"),
            M("Rozetka qutichalari", "Кольца розеточные"),
            M("Olmosli koronka 70", "Коронка алмазная 70"),
            M("PVX gofra quvur d20 zondli (100 m) IEK", "Труба гофр.ПВХ d 20 с зондом (100м) ИЭК", "metr"),
            M("Quvur uchun klipsa D20", "Крепёж-клипса для труб Д20"),
            M("Trek relsi", "Трек релс", "metr"),
            M("Avtomatli plastik shchit", "Щиток пластиковый с автоматами", "komplekt"),
            M("Izolenta", "Изолента"),
            M(Lift, LiftRu),
            M(Delivery, DeliveryRu),
            M("Mis quvurlar 6, 9, 12", "трубы медные 6,9,12", "kg"),
            M("K-fleks 6, 9, 12", "к-флекс 6,9,12"),
            M("Neylon lenta", "лента нейлон"),
            M("Sim 4x1,5", "провод 4х1.5", "metr"),
        }),
        new("Devor va qiyaliklarni suvoqlash", "Штукатурка стен и откосов", "Bo'yoq va suvoq", new[]
        {
            M("Gipsli suvoq aralashmasi Rotband", "Гипсовая смесь Ротбанд", "qop"),
            M("Knauf multigrunt", "Кнауф мультигрунт"),
            M("Ventum betonokontakt 23", "Вентум бетоноконтакт 23"),
            M("Shisha tolali to'r", "Сетка из стекловолокна", "rulon"),
            M("Perfomayak", "Перфомаяк"),
            M("Perfo burchak", "Перфоугол"),
            M("Oddiy valik", "Валик оддий"),
            M("Plastik chelak", "Ведро пластиковое"),
            M("Qo'lqop", "Перчатки"),
            M(Lift, LiftRu),
            M(Delivery, DeliveryRu),
        }),
        new("Shiftni gipsokarton bilan qoplash", "Обшивка потолка гипсокартоном", "Gipsokarton", new[]
        {
            M("Gipsokarton 12 mm", "Гипсокартон 12mm", "list"),
            M("Profil 28x27", "Профиль 28х27", "metr"),
            M("Profil 60x27", "Профиль 60х27", "metr"),
            M("Profil 75x40", "Профиль 75х40", "metr"),
            M("Profil 75x50", "Профиль 75х50", "metr"),
            M("Knauf dauspant lenta 7", "кнауф дауспант лента 7"),
            M("Vero daysin", "веро дайсин"),
            M("Reka 6*45", "река 6*45"),
            M("Tosh disk 125", "тош 125"),
            M("Reyka", "Рейка", "metr"),
            M("Tavriko", "Таврико"),
            M("Epa gul 125", "эпа гул 125"),
            M("Yashil disk 125", "яшил диск 125"),
            M("Vero silikon pistoleti", "веро писталет селкон"),
            M("Qo'lqop (salat rang)", "перчатка салат"),
            M("To'g'ri osma (podves)", "Подвес прямой"),
            M("Samorezlar", "Саморезы", "kg"),
            M("Samorezlar", "Саморезы", "kg"),
            M("Dyubel-probkalar", "Дюбель-пробки", "kg"),
            M("Bur 6", "Бур 6"),
            M("Tig'lar (lezviya)", "Лезвия", "pachka"),
            M("Nasadkalar", "Насадки"),
            M(Lift, LiftRu),
            M(Delivery, DeliveryRu),
        }),
        new("Kafel-plitka ishlari", "Облицовочные работы", "Plitka", new[]
        {
            M("Kafel 60x120", "Кафель 60х120", "m²"),
            M("Kafel 60x30", "Кафель 60х30", "m²"),
            M("Kafel yelimi", "Клей кафельный", "qop"),
            M("Qum", "Кум", "qop"),
            M("Sement", "цемент"),
            M("Qisqichlar, ponalar", "Зажимы, клинья", "pachka"),
            M("Akfiks", "Акфикс"),
            M("Olmosli disk", "Диск алмазный"),
            M("Olmosli koronkalar", "Коронки алмазные"),
            M("Malyar skotchi", "Малярный скотч"),
            M("Rangli chok to'ldirgich (zatirka)", "Затирка для швов цветная", "kg"),
            M("Ikki komponentli yelim", "Двухкомпонентный клей"),
            M("Plastik reviziya lyuki", "Ревизионный лючок пластиковый"),
            M("Kafel uchun lyuk 120*60", "лючок для кафель 120*60"),
            M(Lift, LiftRu),
            M("Gidroizolyatsiya", "Гидроизолация", "chelak"),
            M("Epa gul", "Эпа гул"),
            M("Polikor", "Поликор"),
            M("Dubl", "Дубл", "kg"),
            M(Delivery, DeliveryRu),
        }),
        new("Bo'yoq ishlari", "Малярные работы", "Bo'yoq va suvoq", new[]
        {
            M("Choklar uchun shpaklyovka Knauf Fugen", "Шпатлевка для швов Кнауф фуген", "qop"),
            M("Shpaklyovka Eleron 01", "Шпатлевка Элерон 01", "qop"),
            M("Shpaklyovka Eleron 05", "Шпатлевка Элерон 05", "qop"),
            M("Serpyanka", "Серпянка"),
            M("Plastik perfo burchak", "Перфоугол пластиковый"),
            M("Malyar skotchi", "Малярный скотч"),
            M("Sellofan", "Целофан", "metr"),
            M("PVA yelimi", "Пва клей"),
            M("Gruntovka", "Грунтовка"),
            M("Oq emulsiya", "Эмульсия белая", "chelak"),
            M("Emulsiya", "Эмульсия", "chelak"),
            M("Qum qog'oz", "Наждачная бумага", "metr"),
            M("Gruntovka uchun valik", "Валик для грунтовки"),
            M("Katta valik", "Валик большой"),
            M("Kichik valik", "Валик маленький"),
            M("Valik uchun teleskopik tayoq", "Телескопическая палка под валик"),
            M("Mo'yqalam (kistochka)", "Кисточка"),
            M("Emulsiyadan bo'shagan plastik chelak", "Ведро пластиковое от эмульсии"),
            M(Lift, LiftRu),
            M("PVS panel", "ПВС Панель"),
            M("Attachento", "Аттаченто", "chelak"),
            M("Kora sellofan", "Кора салафан", "kg"),
            M(Delivery, DeliveryRu),
        }),
        new("Laminat pol yotqizish", "Монтаж пола из ламината", "Pol qoplamasi", new[]
        {
            M("Quyma pol", "Наливной пол", "qop"),
            M("Gruntovka", "Грунтовка"),
            M("Laminat", "Ламинат", "m²"),
            M("Plastik plintus", "Плинтус пластиковый", "metr"),
            M("Plintus burchaklari va qopqoqlari", "Повороты, заглушки к плинтусу"),
            M("Alyuminiy porog", "Порожек алюминиевый"),
            M("Malyar skotchi", "Малярный скотч"),
            M("Dyubel-probkalar", "Дюбель-пробки", "kg"),
            M("Pol valigi", "Пол валик"),
            M("Valik chup", "Валик чуп"),
            M("Germetik", "Герметик"),
            M(Lift, LiftRu),
            M(Delivery, DeliveryRu),
        }),
        new("Yoritish montaji", "Монтаж освещения", "Elektr", new[]
        {
            M("Nuqtali chiroq (yakka)", "Светильник точечный одинарный"),
            M("Trek uchun nuqtali chiroq", "Светильник точечный для трека"),
            M("Klemmalar", "Клемники"),
            M("Elektr jihozlari", "Электроприборы"),
            M("Qandil (lyustra)", "Люстра"),
            M(Delivery, DeliveryRu),
        }),
        new("Santexnika jihozlari", "Сантехнические приборы", "Santexnika", new[]
        {
            M("Dush poddoni / dush zonasi (shartli narx)", "Душевой поддон / зона душа (условная цена)"),
            M("Dush to'sig'i (shartli narx)", "Душевое ограждение (условная цена)"),
            M("Unitaz", "Унитаз"),
            M("Rakovina", "Раковина"),
            M("Dush uchun smesitel (shartli narx)", "Смеситель для душа (условная цена)"),
            M("Rakovina smesiteli", "Смеситель на раковину"),
            M("Sochiq quritgich", "Полотенцесушитель"),
            M("Kesuvchi ventillar", "Отсекающие вентиля"),
            M("Unitaz gofrasi", "Гофра для унитаза"),
            M("Trap / dush sifoni (shartli narx)", "Трап / сифон для душа (условная цена)"),
            M("Rakovina sifoni", "Сифон для раковины"),
            M("Hojatxona uchun oynali aksessuarlar to'plami", "Набор аксессуаров с зеркалом в с/узел", "komplekt"),
            M("Germetik", "Герметик"),
            M(Lift, LiftRu),
            M(Delivery, DeliveryRu),
        }),
        new("Xonalararo eshiklar", "Межкомнатные двери", "Eshik va deraza", new[]
        {
            M("Eshiklar", "Двери", "komplekt"),
            M("Petlyalar (navesy)", "Навесы"),
            M("Qulf va tutqichlar", "Замок и ручки", "komplekt"),
            M("Suyuq mixlar", "Жидкие гвозди"),
            M("Montaj ko'pigi", "Пена монтажная"),
            M(Lift, LiftRu),
            M("Shisha to'siq (peregorodka)", "Стекло перегородка", "komplekt"),
            M(Delivery, DeliveryRu),
        }),
    };

    private static readonly Dictionary<string, DefaultMaterial> DefaultMaterialsByRussian = DefaultPurchaseSections
        .SelectMany(s => s.Items)
        .GroupBy(m => MatchKey(m.Russian))
        .ToDictionary(g => g.Key, g => g.First());

    private static readonly Dictionary<string, DefaultMaterial> DefaultMaterialsByName = DefaultPurchaseSections
        .SelectMany(s => s.Items)
        .GroupBy(m => MatchKey(m.Name))
        .ToDictionary(g => g.Key, g => g.First());

    private static readonly Dictionary<string, string> DefaultSectionCategories = DefaultPurchaseSections
        .SelectMany(s => new[] { (MatchKey(s.Title), s.Category), (MatchKey(s.Russian), s.Category) })
        .GroupBy(x => x.Item1)
        .ToDictionary(g => g.Key, g => g.First().Category);

    /// <summary>Ruscha (eski smeta) nomini standart o'zbekcha nomga o'giradi; standart ro'yxatda bo'lmasa — o'zgarishsiz.</summary>
    private static DefaultMaterial? FindDefaultMaterial(string name) =>
        DefaultMaterialsByName.TryGetValue(MatchKey(name), out var byName) ? byName
        : DefaultMaterialsByRussian.TryGetValue(MatchKey(name), out var byRu) ? byRu
        : null;
}
