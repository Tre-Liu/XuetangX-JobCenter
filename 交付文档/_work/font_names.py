from fontTools.ttLib import TTCollection

for path in [
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]:
    try:
        collection = TTCollection(path)
    except Exception as exc:
        print(path, exc)
        continue
    print(path)
    for font in collection.fonts[:8]:
        values = []
        for name in font["name"].names:
            if name.nameID not in (1, 4, 6):
                continue
            try:
                value = name.toUnicode()
            except Exception:
                continue
            if value not in values:
                values.append(value)
        print(values[:14])
