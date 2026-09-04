namespace WorkDex.Api.Models;

// PDF §4 — Xarajat kategoriyalari
public enum ExpenseCategory
{
    Labor = 1,          // Usta va mehnat xarajatlari
    Material = 2,       // Material xarajatlari
    Transport = 3,      // Transport va logistika
    Fuel = 4,           // Yoqilg'i
    Subcontractor = 5,  // Subpudratchilar
    Extra = 6,          // Qo'shimcha loyiha xarajatlari
    Other = 7,          // Boshqa xarajatlar
    Cleaning = 8,       // Tozalash ishlari
    Carrying = 9,       // Yuklarni tashish/ko'tarish
    AdditionalWork = 10,// Qo'shimcha mayda ishlar
    Electricity = 11,   // Elektr (svet)
    Internet = 12,      // Internet
    Rent = 13,          // Ofis ijarasi
    OfficeSupplies = 14, // Ofis jihozlari
    Water = 15,         // Suv to'lovi
    Gas = 16,           // Gaz to'lovi
    Communal = 17       // Umumiy kommunal xarajatlar
}
