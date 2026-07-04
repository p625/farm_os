# Art QA Checklist

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T3 |
| **Vlastník** | Tech Art Lead |
| **Backup** | příslušný Domain Lead |
| **Review** | Měsíčně |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální checklist |

---

## Účel

Objektivní **„done"** — propojení všech guides do review listu. Použít při internal i outsource delivery.

**Asset:** `________________`  
**Reviewer:** `________________`  
**Datum:** `________________`

---

## 1. Pipeline & technika

- [ ] Naming dle [Asset Pipeline Spec](../02_Production_Guidelines/Asset_Pipeline_Spec.md)
- [ ] Scale 1 unit = 1 m, pivot dle kategorie
- [ ] LODs dodány a pojmenované
- [ ] Texel density v budgetu
- [ ] UV bez degenerate, padding OK
- [ ] Export glTF bez chyb v Babylon loaderu
- [ ] Žádné nepoužité materiály / nodes

## 2. Materiály & PBR

- [ ] Roughness/metallic v rozsahu [Material Guide](../02_Production_Guidelines/Material_Guide.md)
- [ ] Wear level odpovídá briefu a Art Bible
- [ ] Textury v správném color space

## 3. Art direction

- [ ] Konzistentní s [Art Bible](../00_Strategy/Art_Bible.md)
- [ ] Domain Bible scope splněn
- [ ] Barvy z [Color Script](../00_Strategy/Color_Script.md) — žádné ad-hoc palety
- [ ] Realism level odpovídá (ne stylizace, ne fotoreal excess)

## 4. In-engine

- [ ] Načte se přes AssetManager bez warningů
- [ ] Čitelný z kamery radius 25, 42, 70 [Camera Guide](../02_Production_Guidelines/Camera_Composition_Guide.md)
- [ ] Stíny a lighting OK v default scéně
- [ ] Performance v budgetu (tris, draw calls)

## 5. Sezónní / VFX (pokud relevantní)

- [ ] Sezónní varianty dle [Seasonal Guide](../01_Domain_Bibles/Seasonal_Visual_Guide.md)
- [ ] VFX hooky dle [VFX Guide](../02_Production_Guidelines/VFX_Guide.md)

## 6. Dokumentace

- [ ] Asset Brief vyplněn a archivován
- [ ] Konflikty zapsány do [Art Decision Log](../01_ART_DECISION_LOG.md)

---

## Výsledek

| | |
|--|--|
| **Status** | Pass / Fail / Pass with notes |
| **Poznámky** | |
| **Sign-off Lead** | |

---

## Související dokumenty

- [Asset_Brief_Template.md](Asset_Brief_Template.md)
- [00_INDEX.md](../00_INDEX.md)
