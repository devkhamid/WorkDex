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
    Other = 7           // Boshqa xarajatlar
}
