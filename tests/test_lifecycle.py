"""Validate all flag combinations, input validation and a real Git-backed update."""
import itertools
import json
import shutil
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FLAGS = ("popup", "sidebar", "settings", "page_context_menu", "toolbar_context_menu")
KEYS = ("popup", "sidebar", "settings", "pageContextMenu", "toolbarContextMenu")
BASE = "53e0a611a041830e6f06d95e80b6c6d55e8c86ec"


def run(*args, cwd=None, check=True):
    return subprocess.run(args, cwd=cwd, check=check, text=True, capture_output=True)


def copy(source, dest, *data, ref="HEAD", check=True):
    return run("copier", "copy", "--defaults", "--vcs-ref=" + ref, *data, str(source), str(dest), check=check)


def git(path, *args):
    return run("git", "-C", str(path), *args)


class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


class LifecycleTests(unittest.TestCase):
    def test_all_feature_combinations(self):
        with tempfile.TemporaryDirectory() as tmp:
            for i, values in enumerate(itertools.product((False, True), repeat=5)):
                with self.subTest(values=values):
                    dest = Path(tmp) / str(i)
                    args = [part for flag, value in zip(FLAGS, values) for part in ("-d", f"include_{flag}={str(value).lower()}")]
                    copy(ROOT, dest, *args)
                    self.assertEqual(json.loads((dest / "features.json").read_text()), dict(zip(KEYS, values)))

    def test_input_validation_and_escaping(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "valid"
            name = 'PDF & <Image> "Tools"'
            description = 'A "quoted" & useful description'
            copy(ROOT, dest, "-d", f"project_name={name}", "-d", f"project_description={description}")
            package = json.loads((dest / "package.json").read_text())
            self.assertEqual(package["name"], "pdf-image-tools")
            self.assertEqual(package["extensionName"], name)
            self.assertEqual(package["description"], description)
            for filename, suffix in (("popup.html", ""), ("sidebar.html", "Sidebar"), ("options.html", "Settings")):
                parser = TitleParser()
                html = (dest / filename).read_text()
                parser.feed(html)
                self.assertEqual(parser.title, f"{name} · {suffix}" if suffix else name)
                self.assertNotIn("<Image>", html)
            for i, data in enumerate(("project_slug=bad/name", "project_slug=UPPER", "project_name=", "project_description=" + "x" * 133)):
                result = copy(ROOT, Path(tmp) / f"invalid-{i}", "-d", data, check=False)
                self.assertNotEqual(result.returncode, 0, data)

    def test_update_preserves_project_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            template = Path(tmp) / "template"
            project = Path(tmp) / "project"
            run("git", "clone", "--no-hardlinks", str(ROOT), str(template))
            git(template, "tag", "-f", "v0.1.0", BASE)
            git(template, "tag", "-f", "v0.2.0", "HEAD")
            copy(template, project, "-d", "project_name=Update Fixture", "-d", "include_sidebar=false", ref="v0.1.0")
            git(project, "init", "-b", "main")
            git(project, "config", "user.name", "Template test")
            git(project, "config", "user.email", "test@example.invalid")
            git(project, "add", ".")
            git(project, "commit", "-m", "Generate old version")
            readme = project / "README.md"
            readme.write_text(readme.read_text() + "\n## Local project notes\nKeep this change.\n")
            (project / "local.txt").write_text("local content\n")
            git(project, "add", ".")
            git(project, "commit", "-m", "Customize project")
            run("copier", "update", "--defaults", "--vcs-ref=v0.2.0", cwd=project)
            self.assertIn("Keep this change.", readme.read_text())
            self.assertEqual((project / "local.txt").read_text(), "local content\n")
            self.assertFalse(json.loads((project / "features.json").read_text())["sidebar"])
            self.assertIn("test:reload", json.loads((project / "package.json").read_text())["scripts"])
            self.assertIn("v0.2.0", (project / ".copier-answers.yml").read_text())
            self.assertFalse(list(project.rglob("*.rej")))


if __name__ == "__main__":
    unittest.main()
