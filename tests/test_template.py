"""Copier smoke tests for both default and slim generated projects."""

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("copier"), "Copier CLI is not installed")
class CopierTemplateTests(unittest.TestCase):
    def render(self, **answers: str) -> Path:
        directory = Path(self.addCleanup_temp_dir())
        output = directory / "extension"
        command = ["copier", "copy", "--defaults", "--vcs-ref=HEAD", str(ROOT), str(output)]
        for key, value in answers.items():
            command.extend(["-d", f"{key}={value}"])
        subprocess.run(command, check=True, capture_output=True, text=True)
        return output

    def addCleanup_temp_dir(self) -> str:
        value = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, value)
        return value

    def test_default_five_interfaces(self):
        output = self.render(project_name="Test Extension", project_slug="test-extension")
        flags = json.loads((output / "features.json").read_text())
        self.assertTrue(all(flags[key] for key in ('popup', 'sidebar', 'settings', 'pageContextMenu', 'toolbarContextMenu')))
        self.assertFalse(any(flags[key] for key in ('keyboardShortcuts', 'toolbarBadge', 'optionalPermissions', 'contentScript')))
        self.assertTrue((output / '.copier-answers.yml').exists())
        self.assertTrue((output / 'AGENTS.md').exists())
        self.assertTrue((output / 'lefthook.yml').exists())
        for size in (16, 32, 48, 128):
            icon = (output / 'icons' / f'icon-{size}.png').read_bytes()
            self.assertEqual(icon[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual(int.from_bytes(icon[16:20], 'big'), size)
            self.assertEqual(int.from_bytes(icon[20:24], 'big'), size)
        self.assertTrue((output / "src/ui/popup/App.svelte").exists())
        self.assertTrue((output / "src/ui/sidebar/App.svelte").exists())
        self.assertTrue((output / "src/ui/settings/App.svelte").exists())
        self.assertEqual(json.loads((output / "package.json").read_text())["name"], "test-extension")

    def test_slim_feature_configuration(self):
        output = self.render(include_sidebar="false", include_settings="false",
                             include_page_context_menu="false", include_toolbar_context_menu="false")
        flags = json.loads((output / "features.json").read_text())
        self.assertEqual(flags, {
            "popup": True, "sidebar": False, "settings": False,
            "pageContextMenu": False, "toolbarContextMenu": False,
            "keyboardShortcuts": False, "toolbarBadge": False,
            "optionalPermissions": False, "contentScript": False
        })


if __name__ == "__main__":
    unittest.main()
