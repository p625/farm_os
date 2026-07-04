# Asset Pipeline Spec — FarmOS

| | |
|--|--|
| **Verze** | v0.1.0 |
| **Status** | Draft |
| **Tier** | T2 |
| **Vlastník** | Tech Art Lead |
| **Backup** | Art Director |
| **Review** | Měsíčně |
| **Poslední změna** | 2026-07-04 |

---

## Changelog

| Verze | Datum | Autor | Shrnutí |
|-------|-------|-------|---------|
| v0.1.0 | 2026-07-04 | — | Iniciální kostra |

---

## Účel

**Kritická technická SoT:** naming, LOD, texel density, pivot points, export formáty, složky v repozitáři.

**[RULE]** Pipeline implementuje vizuální záměr z bible — **nesmí** měnit art direction, jen enforce konzistenci.

**Vazba:** `src/assets/AssetManager.ts` — runtime loading.

---

## 1. Struktura složek (návrh)

```text
public/
  assets/
    meshes/          # glTF / Babylon assets
    textures/
    materials/
    audio/
src/
  rendering/         # Presentation — vizualizace
  assets/            # Asset registry, loaders
```

_TBD: finální konvence po prvním production asset batchi._

---

## 2. Obsahová osnova (TBD)

- [ ] Naming convention (`{domain}_{type}_{variant}_{lod}`)
- [ ] Export formáty (glTF 2.0 preferred)
- [ ] Jednotky a scale (1 unit = 1 m)
- [ ] Pivot a origin pravidla per kategorie
- [ ] LOD levels a přechodové vzdálenosti
- [ ] Texel density (tex/m) per kategorie
- [ ] UV a padding pravidla
- [ ] Material slot naming
- [ ] Versioning assetů v repo
- [ ] Import checklist do Babylon.js

---

## 3. Budget tabulky (TBD)

| Kategorie | Tris (LOD0) | Texture | LOD count |
|-----------|-------------|---------|-----------|
| Tractor | _TBD_ | _TBD_ | _TBD_ |
| Building (silo) | _TBD_ | _TBD_ | _TBD_ |
| Tree | _TBD_ | _TBD_ | _TBD_ |
| Prop small | _TBD_ | _TBD_ | _TBD_ |

---

## Související dokumenty

- [Material_Guide.md](Material_Guide.md)
- [Art_QA_Checklist.md](../03_Templates/Art_QA_Checklist.md)
- [Outsource_Package_Spec.md](../03_Templates/Outsource_Package_Spec.md)
