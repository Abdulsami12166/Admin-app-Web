from pathlib import Path
root = Path(r'C:\RN\Backend-admin\src\controllers\admin')
changed = []
for path in root.glob('*.js'):
    text = path.read_text()
    if "require('../models/" in text:
        new = text.replace("require('../models/", "require('../../models/")
        path.write_text(new)
        changed.append(str(path.relative_to(root)))
print('patched:', changed)
